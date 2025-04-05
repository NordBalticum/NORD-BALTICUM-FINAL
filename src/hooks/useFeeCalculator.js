export function useFeeCalculator(network, amount) {
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchGasPrice = useCallback(async () => {
    try {
      if (!network) return;

      const provider = new ethers.JsonRpcProvider(RPC_URLS[network]);
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits("5", "gwei");
      const gasCost = Number(ethers.formatEther(gasPrice * BigInt(21000)));

      setGasFee(gasCost);
    } catch (error) {
      console.error("❌ Gas fetch error:", error.message);
      setGasFee(0);
    }
  }, [network]);

  useEffect(() => {
    if (amount || network) {
      fetchGasPrice(); // Dinamiškai kai įvedi amount arba keiti network
    }
  }, [fetchGasPrice, amount, network]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchGasPrice();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchGasPrice]);

  useEffect(() => {
    const adminFeeAmount = amount ? (Number(amount) * 3) / 100 : 0;
    setAdminFee(adminFeeAmount);
  }, [amount]);

  useEffect(() => {
    setTotalFee(gasFee + adminFee);
    setLoading(false);
  }, [gasFee, adminFee]);

  return {
    gasFee,
    adminFee,
    totalFee,
    loading,
    refetchFees: fetchGasPrice,
  };
}
