import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { ContractState } from './ContractState';

import { ethers } from 'ethers';

function stateColor(state) {
  switch (state) {
    case ContractState.Pending:
      return "orange";
    case ContractState.Approved:
      return "green";
    case ContractState.Expired:
      return "red";
      default:
        break;  
  }
}

function stateMessage(state) {
  switch (state) {
    case ContractState.Pending:
      return "Pending";
    case ContractState.Approved:
      return "✓ It's been approved!";
    case ContractState.Expired:
      return "x It's been expired!";
      default:
        break;  
  }
}

export default function Escrow({
  address,
  arbiter,
  beneficiary,
  value,
  expiry,
  state,
  handleApprove,
  handleCheckExpiry
}) {
  return (
    <Box m={1}>
      <Card>
        <CardContent>
          <Typography variant="caption" color="text.primary" gutterBottom>
            Address:
          </Typography>
          <Typography varian="body1" color="text.secondary" gutterBottom>
            {address}
          </Typography>
          <Typography variant="caption" color="text.primary" gutterBottom>
            Arbiter:
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {arbiter}
          </Typography>
          <Typography variant="caption" color="text.primary" gutterBottom>
            Beneficiary:
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {beneficiary}
          </Typography>
          <Typography variant="caption" color="text.primary" gutterBottom>
            Amount:
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {ethers.utils.formatEther(value)} ETH
          </Typography>
          <Typography variant="caption" color="text.primary" gutterBottom>
            {state === ContractState.Expired ? "Expired after:" : "Expires after:"}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {expiry === 0 ? "-" : (new Date(expiry)).toLocaleString()}
          </Typography>
          <Typography sx={{ mb: 1.5 }} color={stateColor(state)}>
            {stateMessage(state)}
          </Typography>
        </CardContent>
        { state === ContractState.Pending &&
          <CardActions>
            <Button variant="outlined" size="small" onClick={(e) => {
              e.preventDefault();
              handleApprove();
            }}>Approve</Button>
            <Button variant="outlined" size="small" onClick={(e) => {
              e.preventDefault();
              handleCheckExpiry();
            }}>Validate</Button>
          </CardActions>
        }
      </Card>
    </Box>
  );
}
