import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { ethers } from 'ethers';

export default function Escrow({
  address,
  arbiter,
  beneficiary,
  value,
  approved,
  handleApprove,
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
          <Typography sx={{ mb: 1.5 }} color={!approved ? "orange" : "green"}>
            {!approved ? "Pending" : "✓ It's been approved!"}
          </Typography>
        </CardContent>
        {!approved &&
          <CardActions>
            <Button variant="outlined" size="small" onClick={(e) => {
              e.preventDefault();
              handleApprove();
            }}>Approve</Button>
          </CardActions>
        }
      </Card>
    </Box>
  );
}
