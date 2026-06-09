import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../../constants/theme';
import { useCustomerStore } from '../../../store/useCustomerStore';
import { CustomerForm } from '../../../components/forms/CustomerForm';
import type { CustomerFormData } from '../../../types';

export default function AddCustomerScreen() {
  const insets = useSafeAreaInsets();
  const { addCustomer } = useCustomerStore();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CustomerForm onSubmit={(data: CustomerFormData) => { addCustomer(data); router.back(); }} onCancel={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background } });
