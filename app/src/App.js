import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import deploy from './deploy';
import Escrow from './Escrow';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/system/Container';

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

import { createTheme } from '@mui/material/styles';
import blue from '@mui/material/colors/blue';
import yellow from '@mui/material/colors/yellow';

import ThemeProvider from '@mui/material/styles/ThemeProvider'

const theme = createTheme({
  palette: {
    primary: blue,
    secondary: yellow
  },
});

const provider = new ethers.providers.Web3Provider(window.ethereum);

export async function approve(escrowContract, signer) {
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}

function App() {
  const [escrows, setEscrows] = useState([]);
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();

  useEffect(() => {
    async function getAccounts() {
      const accounts = await provider.send('eth_requestAccounts', []);

      setAccount(accounts[0]);
      setSigner(provider.getSigner());
    }

    getAccounts();
  }, [account]);

  async function newContract() {
    const beneficiary = document.getElementById('beneficiary').value;
    const arbiter = document.getElementById('arbiter').value;
    const value = ethers.utils.parseEther(document.getElementById('eth').value);
    const escrowContract = await deploy(signer, arbiter, beneficiary, value);


    const escrow = {
      address: escrowContract.address,
      arbiter,
      beneficiary,
      value: value.toString(),
      handleApprove: async () => {
        escrowContract.on('Approved', () => {
          document.getElementById(escrowContract.address).className =
            'complete';
          document.getElementById(escrowContract.address).innerText =
            "✓ It's been approved!";
        });

        await approve(escrowContract, signer);
      },
    };

    setEscrows([...escrows, escrow]);
  }

  return (
    <>
      <ThemeProvider theme={theme}>
        <Container sx={{ flexGrow: 5 }}>

          <Box sx={{ flexGrow: 1 }}>
            <AppBar position="absolute" color='default'>
              <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  Escrow App
                </Typography>
                <Button variant="outlined" endIcon={<AccountBalanceWalletIcon />}>
                  Connect
                </Button>
              </Toolbar>
            </AppBar>
          </Box>


          <Box position="relative">
            <div className="contract">
              <h1> New Contract </h1>
              <label>
                Arbiter Address
                <input type="text" id="arbiter" />
              </label>

              <label>
                Beneficiary Address
                <input type="text" id="beneficiary" />
              </label>

              <label>
                Deposit Amount (in Eth)
                <input type="text" id="eth" />
              </label>

              <div
                className="button"
                id="deploy"
                onClick={(e) => {
                  e.preventDefault();

                  newContract();
                }}
              >
                Deploy
              </div>
            </div>
          </Box>
          <Box position="relative">
            <div className="existing-contracts">
              <h1> Existing Contracts </h1>

              <div id="container">
                {escrows.map((escrow) => {
                  return <Escrow key={escrow.address} {...escrow} />;
                })}
              </div>
            </div>
          </Box>
        </Container>
      </ThemeProvider>

    </>
  );
}

export default App;
