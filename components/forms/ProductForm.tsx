import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { t } from '../../i18n';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import type { ProductFormData, Product } from '../../types';

interface ProductFormProps {
  initialValues?: Product;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  onScanBarcode?: () => void;
  onPickImage?: () => void;
  scannedBarcode?: string;
}

export const ProductForm = ({
  initialValues,
  onSubmit,
  onCancel,
  onScanBarcode,
  onPickImage,
  scannedBarcode,
}: ProductFormProps) => {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [barcode, setBarcode] = useState(initialValues?.barcode ?? '');

  useEffect(() => {
    if (scannedBarcode) setBarcode(scannedBarcode);
  }, [scannedBarcode]);
  const [buyPrice, setBuyPrice] = useState(initialValues?.buy_price?.toString() ?? '0');
  const [sellPrice, setSellPrice] = useState(initialValues?.sell_price?.toString() ?? '0');
  const [quantity, setQuantity] = useState(initialValues?.quantity?.toString() ?? '0');
  const [lowStockThreshold, setLowStockThreshold] = useState(
    initialValues?.low_stock_threshold?.toString() ?? '5'
  );
  const [category, setCategory] = useState(initialValues?.category ?? '');
  const [imageUri, setImageUri] = useState(initialValues?.image_uri ?? null);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = t('productForm.nameRequired');
    }

    const buy = parseFloat(buyPrice) || 0;
    const sell = parseFloat(sellPrice) || 0;

    if (sell <= 0) {
      newErrors.sellPrice = t('productForm.sellPriceInvalid');
    }

    if (sell < buy) {
      newErrors.sellPrice = t('productForm.sellPriceHigher');
    }

    const qty = parseInt(quantity) || 0;
    if (qty < 0) {
      newErrors.quantity = t('productForm.qtyNegative');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      name: name.trim(),
      barcode: barcode.trim() || undefined,
      buyPrice: parseFloat(buyPrice) || 0,
      sellPrice: parseFloat(sellPrice) || 0,
      quantity: parseInt(quantity) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 5,
      category: isCustomCategory ? customCategory : (category || undefined),
      imageUri: imageUri ?? undefined,
    });
  };

  const selectedCategory = isCustomCategory ? 'Custom' : category;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {imageUri && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <TouchableOpacity
            style={styles.removeImage}
            onPress={() => setImageUri(null)}
          >
            <MaterialCommunityIcons name="close-circle" size={24} color={colors.danger} />
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.imagePicker} onPress={onPickImage}>
        <MaterialCommunityIcons name="camera" size={20} color={colors.primary} />
        <Text style={styles.imagePickerText}>
          {imageUri ? t('productForm.changeImage') : t('productForm.addImage')}
        </Text>
      </TouchableOpacity>

      <View style={styles.field}>
        <Text style={styles.label}>{t('productForm.name')}</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={name}
          onChangeText={setName}
          placeholder={t('productForm.namePlaceholder')}
          placeholderTextColor={colors.textDisabled}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('productForm.barcode')}</Text>
        <View style={styles.barcodeRow}>
          <TextInput
            style={[styles.input, styles.barcodeInput]}
            value={barcode}
            onChangeText={setBarcode}
            placeholder={t('productForm.barcodePlaceholder')}
            placeholderTextColor={colors.textDisabled}
          />
          <TouchableOpacity style={styles.scanButton} onPress={onScanBarcode}>
            <MaterialCommunityIcons name="barcode-scan" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('productForm.category')}</Text>
        <View style={styles.categoryRow}>
          {DEFAULT_CATEGORIES.filter(c => c !== 'Other').map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipSelected]}
              onPress={() => { setCategory(cat); setIsCustomCategory(false); }}
            >
              <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextSelected]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.categoryChip, isCustomCategory && styles.categoryChipSelected]}
            onPress={() => { setIsCustomCategory(true); setCategory(''); }}
          >
            <Text style={[styles.categoryChipText, isCustomCategory && styles.categoryChipTextSelected]}>
              {t('inventory.other')}
            </Text>
          </TouchableOpacity>
        </View>
        {isCustomCategory && (
          <TextInput
            style={[styles.input, { marginTop: spacing.sm }]}
            value={customCategory}
            onChangeText={setCustomCategory}
            placeholder={t('productForm.enterCustom')}
            placeholderTextColor={colors.textDisabled}
          />
        )}
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1, marginRight: spacing.sm }]}>
          <Text style={styles.label}>{t('productForm.buyPrice')}</Text>
          <TextInput
            style={styles.input}
            value={buyPrice}
            onChangeText={setBuyPrice}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textDisabled}
          />
        </View>
        <View style={[styles.field, { flex: 1, marginLeft: spacing.sm }]}>
          <Text style={styles.label}>{t('productForm.sellPrice')}</Text>
          <TextInput
            style={[styles.input, errors.sellPrice && styles.inputError]}
            value={sellPrice}
            onChangeText={setSellPrice}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textDisabled}
          />
          {errors.sellPrice && <Text style={styles.errorText}>{errors.sellPrice}</Text>}
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1, marginRight: spacing.sm }]}>
          <Text style={styles.label}>{t('productForm.qty')}</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textDisabled}
          />
          {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
        </View>
        <View style={[styles.field, { flex: 1, marginLeft: spacing.sm }]}>
          <Text style={styles.label}>{t('productForm.lowStockAlert')}</Text>
          <TextInput
            style={styles.input}
            value={lowStockThreshold}
            onChangeText={setLowStockThreshold}
            keyboardType="numeric"
            placeholder="5"
            placeholderTextColor={colors.textDisabled}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>
            {initialValues ? t('productForm.updateProduct') : t('productForm.addProduct')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.md,
  },
  removeImage: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  imagePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    borderStyle: 'dashed',
  },
  imagePickerText: {
    ...typography.body2,
    color: colors.primary,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...typography.body1,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barcodeInput: {
    flex: 1,
    marginRight: spacing.sm,
  },
  scanButton: {
    padding: spacing.sm,
    backgroundColor: '#E3F2FD',
    borderRadius: borderRadius.md,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  categoryChipSelected: {
    borderColor: colors.primary,
    backgroundColor: '#E3F2FD',
  },
  categoryChipText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  categoryChipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  submitButton: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  submitText: {
    ...typography.button,
    color: '#FFFFFF',
  },
});
