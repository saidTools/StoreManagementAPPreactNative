import { useState, useEffect, useCallback } from 'react';
import { Camera } from 'expo-camera';

export const useBarcodeScanner = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [data, setData] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleScan = useCallback(({ data: barcodeData }: { data: string }) => {
    setScanned(true);
    setData(barcodeData);
  }, []);

  const reset = useCallback(() => {
    setScanned(false);
    setData(null);
  }, []);

  return {
    hasPermission,
    scanned,
    data,
    handleScan,
    reset,
    setScanned,
  };
};
