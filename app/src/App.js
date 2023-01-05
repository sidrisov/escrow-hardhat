import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import deploy from './deploy';
import deployFactory from './deployFactory';
import Escrow from './Escrow';
import EscrowFactoryContract from './artifacts/contracts/EscrowFactory.sol/EscrowFactory.json';
import EscrowContract from './artifacts/contracts/Escrow.sol/Escrow';


import { ContractState } from './ContractState';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Fab from '@mui/material/Fab';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import AccountBalanceIcon from '@mui/icons-material/PublishedWithChanges';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';

import createTheme from '@mui/material/styles/createTheme';
import blue from '@mui/material/colors/blue';
import yellow from '@mui/material/colors/yellow';

import ThemeProvider from '@mui/material/styles/ThemeProvider'

const theme = createTheme({
  palette: {
    primary: blue,
    secondary: yellow
  },
});

const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

export async function approve(escrowContract, signer) {
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}

export async function validate(escrowContract, signer) {
  const approveTxn = await escrowContract.connect(signer).validate();
  await approveTxn.wait();
}

const minute = 60 * 1000;
const hour = 60 * minute;
const day = 24 * hour;
const week = 7 * day;
const month = 30 * day;

const expiries = [
  {
    value: 0,
    label: "None",
  },
  {
    value: minute,
    label: "Minute",
  },
  {
    value: hour,
    label: "Hour",
  },
  {
    value: day,
    label: "Day",
  },
  {
    value: week,
    label: "Week",
  },
  {
    value: month,
    label: "Month",
  }

];

function App() {
  const [escrows, setEscrows] = useState({ "arr": [] });
  const [account, setAccount] = useState();
  const [connected, setConnected] = useState(false);
  const [factoryAddress, setFactoryAddress] = useState("0xC8Ec44A70291aCe21Bc0CBF6C2d5eCd07DF38e2D");
  const [factoryContract, setFactoryContract] = useState();
  const [filter, setFilter] = useState({
    "pending": true,
    "all": true
  });

  const [openContractDialog, setOpen] = useState(false);

  const handleClickOpenContractDialog = () => {
    setOpen(true);
  };

  const handleCloseContractDialog = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (connected) {
      if (factoryAddress.length !== 0) {
        const factory = new ethers.Contract(factoryAddress, EscrowFactoryContract.abi, provider.getSigner())
        setFactoryContract(factory);
      }
    } else {
      setEscrows({ "arr": [] });
    }
  }, [connected, factoryAddress]);

  useEffect(() => {
    (async () => {
      if (!connected) {
        return;
      }

      if (factoryContract) {
        setEscrows({ "arr": [] });
        factoryContract.on("Created", async (address) => { loadContract(address) });
        const addresses = await factoryContract.getAddresses();
        if (addresses.length > 0) {
          for (let i = 0; i < addresses.length; i++) {
            loadContract(addresses[i]);
          }
        }
      }
    })()
  }, [connected, factoryContract]);

  async function connectWallet() {
    const accounts = await provider.send('eth_requestAccounts', []);

    if (accounts.length !== 0) {
      setAccount(accounts[0]);

      if (factoryAddress.length === 0) {
        const address = (await deployFactory(provider.getSigner())).address;
        console.log("Escrow Factory Contract Address: ", address);
        setFactoryAddress(address);
      }

      setConnected(true);
    }
  }

  async function loadContract(address) {
    console.log("lodaing contract: ", address);

    const escrowContract = new ethers.Contract(address, EscrowContract.abi, provider.getSigner());

    let state = ContractState.Pending;
    if (await escrowContract.isApproved()) {
      state = ContractState.Approved;
    }
    if (await escrowContract.isExpired()) {
      state = ContractState.Expired;
    }

    const escrow = {
      address: escrowContract.address,
      arbiter: await escrowContract.arbiter(),
      beneficiary: await escrowContract.beneficiary(),
      value: await provider.getBalance(escrowContract.address),
      expiry: (await escrowContract.expiry()).toNumber(),
      state,
      handleApprove: async () => {
        escrowContract.on("Approved", () => {
          const arr = escrows.arr.map(esc => {
            if (esc.address === escrowContract.address) {
              esc.state = ContractState.Approved;
            }
            return esc;
          });

          setEscrows({ ...escrows, arr });
        });

        await approve(escrowContract, provider.getSigner());
      },
      handleCheckExpiry: async () => {
        escrowContract.on("Expired", () => {
          const arr = escrows.arr.map(esc => {
            if (esc.address === escrowContract.address) {
              esc.state = ContractState.Expired;
            }
            return esc;
          });

          setEscrows({ ...escrows, arr });

        });

        await validate(escrowContract, provider.getSigner());
      },
    };

    const arr = escrows.arr;
    arr.push(escrow);
    setEscrows({ ...escrows, arr });
  }

  async function disconnectWallet() {
    setConnected(false);
  }

  async function filterByAssignee() {
    const allFilter = !filter.all;
    setFilter({ ...filter, all: allFilter });
  }

  async function filterByPending() {
    const pendingFilter = !filter.pending;
    setFilter({ ...filter, pending: pendingFilter });
  }

  async function newContract() {
    const beneficiary = document.getElementById("beneficiary").value;
    const arbiter = document.getElementById("arbiter").value;
    const value = ethers.utils.parseEther(document.getElementById("eth").value);
    const expiry = parseInt(document.getElementById("expiry").value);
    await deploy(factoryContract, arbiter, beneficiary, expiry, value);
  }

  return (
    <>
      <ThemeProvider theme={theme}>
        <AppBar position="fixed" color="primary">
          <Toolbar variant="dense">
            <AccountBalanceIcon color={connected ? "secondary" : "inherit"} />
            <Typography color={connected ? "secondary" : "inherit"} variant="h6" sx={{ flexGrow: 1 }}>
              ESCROW
            </Typography>
            {
              connected &&
              <>
                <Stack direction="row" spacing={1}>
                  <Chip label="Pending" size="small" variant="filled" color={filter.pending ? "secondary" : "info"} clickable={!filter.pending} onClick={() => { !filter.pending && filterByPending() }} />
                  <Chip label="Completed" size="small" variant="filled" color={filter.pending ? "info" : "secondary"} clickable={filter.pending} onClick={() => { filter.pending && filterByPending() }} />

                  <Divider orientation="vertical" flexItem sx={{ bgcolor: "white" }} />

                  <Chip label="All" size="small" variant="filled" color={filter.all ? "secondary" : "info"} clickable={!filter.all} onClick={() => { !filter.all && filterByAssignee() }} />

                  <Chip label="Assigned to me" size="small" variant="filled" color={filter.all ? "info" : "secondary"} clickable={filter.all} onClick={() => { filter.all && filterByAssignee() }} />

                  <Divider orientation="vertical" flexItem sx={{ bgcolor: "white" }} />

                  <Chip label={account} size="small" variant="filled" color="secondary" deleteIcon={<PowerSettingsNewIcon />} onDelete={() => { disconnectWallet() }} />
                </Stack>
              </>
            }
            {
              !connected &&
              <Button size="small" variant="outlined" color="inherit" endIcon={<AccountBalanceWalletIcon />} onClick={() => { connectWallet() }}>
                Connect
              </Button>
            }
          </Toolbar>
        </AppBar>
        {
          !connected &&
          <Typography m={30} align="center" variant="h4">
            “Building Web3 Escrow Powered by Cryptographic Truth”
          </Typography>
        }
        {
          connected &&
          <>
            <Dialog open={openContractDialog} onClose={handleCloseContractDialog}>
              <DialogTitle>New Contract</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  To deploy a new contract please specify following fields:
                </DialogContentText>
                <Box component="form" id="contract"
                  sx={{
                    '& > :not(style)': { m: 1, width: '25ch' },
                  }}>

                  <TextField variant="standard" label="Arbiter Address" id="arbiter" />
                  <TextField variant="standard" label="Beneficiary Address" id="beneficiary" />
                  <TextField select variant="standard" label="Expires after" id="expiry"
                    SelectProps={{
                      native: true,
                    }}>
                    {expiries.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </TextField>
                  <TextField
                    variant="standard" label="Deposit Amount"
                    id="eth" type="text"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">ETH</InputAdornment>,
                      inputMode: "numeric", pattern: "[0-9]*"
                    }
                    }
                  />
                </Box>
              </DialogContent>
              <DialogActions>
                <Button variant="outlined" size="small" color="primary"
                  onClick={handleCloseContractDialog}>Cancel</Button>
                <Button
                  variant="contained" size="small" color="primary" onClick={(e) => {
                    e.preventDefault();
                    newContract();
                    handleClickOpenContractDialog();
                    handleCloseContractDialog();
                  }}>Deploy
                </Button>
              </DialogActions>
            </Dialog>
            <Box m={1} mt={7}>
              <Grid container>
                {escrows.arr.filter(escrow =>
                  (filter.all || escrow.arbiter.toLowerCase() === account.toLowerCase())
                  && ((filter.pending && escrow.state === ContractState.Pending)
                    || (!filter.pending && (escrow.state === ContractState.Approved || escrow.state === ContractState.Expired)))
                )
                  .map((escrow) => (
                    <Grid item key={"gridItem:" + escrow.address}>
                      <Escrow key={escrow.address} {...escrow} />
                    </Grid>
                  ))}
              </Grid>
            </Box>
            <Fab color="secondary" size="small" variant="extended" aria-label="add" sx={{
              position: "absolute",
              bottom: 25,
              right: 25
            }} onClick={handleClickOpenContractDialog}>
              + Contract
            </Fab>
          </>
        }
      </ThemeProvider>
    </>
  );
}
export default App;
