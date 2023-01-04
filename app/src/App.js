import { ethers } from 'ethers';
import { useState } from 'react';
import deploy from './deploy';
import Escrow from './Escrow';

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
    value: "-1",
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
  const [signer, setSigner] = useState();
  const [connected, setConnected] = useState(false);
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

  async function connectWallet() {
    const accounts = await provider.send('eth_requestAccounts', []);

    if (accounts.length !== 0) {
      setAccount(accounts[0]);
      setSigner(provider.getSigner());
      setConnected(true);
    }
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
    let expiry = parseInt(document.getElementById("expiry").value);

    const escrowContract = await deploy(signer, arbiter, beneficiary, expiry === -1 ? 0 : expiry, value);

    if (expiry !== -1) {
      expiry += Date.now();
    }

    const escrow = {
      address: escrowContract.address,
      arbiter,
      beneficiary,
      value: value.toString(),
      expiry,
      state: ContractState.Pending,
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

        await approve(escrowContract, signer);
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

        await validate(escrowContract, signer);
      },
    };

    const arr = escrows.arr;
    arr.push(escrow);
    setEscrows({ ...escrows, arr });
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
