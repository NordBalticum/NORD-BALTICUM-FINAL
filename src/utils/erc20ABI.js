// utils/erc20ABI.js

// ===================================================
// ✅ ERC20_ABI – minimalus ir saugus rinkinys
// ✅ Naudojamas fees, balanceOf, transfer funkcijoms
// ===================================================
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)"
];

export default ERC20_ABI;
