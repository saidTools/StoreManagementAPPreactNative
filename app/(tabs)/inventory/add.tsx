import { useState } from 'react';
import { StyleSheet, View, Alert, Modal, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { t } from '../../../i18n';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors } from '../../../constants/theme';
import { useProductStore } from '../../../store/useProductStore';
import { canAddProduct } from '../../../utils/subscriptionGate';
import { ProductForm } from '../../../components/forms/ProductForm';
import type { ProductFormData } from '../../../types';

export default function AddProductScreen() {
  const insets = useSafeAreaInsets();
  const { addProduct, getProductsCount } = useProductStore();
  const [barcode, setBarcode] = useState<string | undefined>();
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [permission, requestPermission] = useCameraPermissions();

  const handleSubmit = (data: ProductFormData) => {
    if (!canAddProduct(getProductsCount())) {
      Alert.alert(t('productForm.limitReached'), t('productForm.upgradeMsg'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('productForm.upgrade'), onPress: () => router.navigate('/settings') },
      ]);
      return;
    }
    addProduct({ ...data, barcode: data.barcode || barcode, imageUri: data.imageUri || imageUri });
    router.back();
  };

  const handleScanBarcode = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) { Alert.alert(t('common.permission'), t('pos.cameraPermission')); return; }
    }
    setScannerOpen(true);
  };

  const handleBarcodeScanned = (data: string) => {
    setScannerOpen(false);
    setScannedCode(data);
    setBarcode(data);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert(t('common.permission'), t('pos.galleryPermission')); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ProductForm onSubmit={handleSubmit} onCancel={() => router.back()}
        onScanBarcode={handleScanBarcode} onPickImage={handlePickImage} scannedBarcode={scannedCode} />

      <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'code128', 'code39', 'code93', 'upc_a', 'upc_e', 'itf14', 'qr'] }}
            onBarcodeScanned={(result) => handleBarcodeScanned(result.data)}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
            <TouchableOpacity style={styles.scannerClose} onPress={() => setScannerOpen(false)}>
              <Text style={styles.scannerCloseText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scannerOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scannerFrame: { width: 250, height: 250, borderWidth: 2, borderColor: colors.primary, borderRadius: 12, backgroundColor: 'transparent' },
  scannerClose: { position: 'absolute', bottom: 60, paddingHorizontal: 32, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  scannerCloseText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
