import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, HelperText, Chip, Text } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ui } from '../../config/theme.config';
import type { CreateItemDto, ItemCategory } from '../../types/api.types';
import { CATEGORY_I18N } from './ItemCard';

const CATEGORIES: ItemCategory[] = [
  'TOOLS',
  'ELECTRONICS',
  'BOOKS',
  'SPORTS',
  'KITCHEN',
  'GARDEN',
  'GAMES',
  'OTHER',
];

interface ItemFormProps {
  mode?: 'create' | 'edit';
  defaultValues?: Partial<CreateItemDto>;
  onSubmit: (data: CreateItemDto) => void;
  isLoading: boolean;
  error?: string;
  submitLabel: string;
}

export function ItemForm({
  mode = 'create',
  defaultValues,
  onSubmit,
  isLoading,
  error,
  submitLabel,
}: ItemFormProps) {
  const { t } = useTranslation();
  const isCreate = mode === 'create';
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateItemDto>({
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      category: defaultValues?.category ?? ('' as ItemCategory),
      estimatedValue: defaultValues?.estimatedValue ?? undefined,
    },
  });

  const selectedCategory = watch('category');

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="name"
        rules={{
          ...(isCreate && { required: t('items.nameRequired') }),
          minLength: { value: 3, message: t('items.nameMinLength') },
          maxLength: { value: 100, message: t('items.nameMaxLength') },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={t('items.name')}
            mode="outlined"
            left={<TextInput.Icon icon="tag-outline" color="#A8B5BF" />}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={!!errors.name}
            testID="name-input"
            style={[styles.input, ui.input]}
            outlineStyle={styles.outline}
          />
        )}
      />
      {errors.name && (
        <HelperText type="error" testID="name-error">
          {errors.name.message}
        </HelperText>
      )}

      <Controller
        control={control}
        name="description"
        rules={{
          maxLength: { value: 500, message: t('items.descriptionMaxLength') },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={t('items.description')}
            mode="outlined"
            multiline
            numberOfLines={3}
            left={<TextInput.Icon icon="text-box-outline" color="#A8B5BF" />}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value ?? ''}
            error={!!errors.description}
            testID="description-input"
            style={[styles.input, ui.input]}
            outlineStyle={styles.outline}
          />
        )}
      />
      {errors.description && (
        <HelperText type="error" testID="description-error">
          {errors.description.message}
        </HelperText>
      )}

      <Text variant="labelLarge" style={styles.categoryLabel}>
        {t('items.category')}
      </Text>
      <Controller
        control={control}
        name="category"
        rules={{
          required: t('items.categoryRequired'),
        }}
        render={({ field: { onChange, value } }) => (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <View style={styles.chipRow}>
              {CATEGORIES.map((cat) => (
                <Chip
                  key={cat}
                  selected={value === cat}
                  onPress={() => onChange(cat)}
                  style={[styles.chip, value === cat && styles.chipSelected]}
                  textStyle={value === cat ? styles.chipTextSelected : undefined}
                  testID={`category-chip-${cat}`}
                >
                  {t(CATEGORY_I18N[cat])}
                </Chip>
              ))}
            </View>
          </ScrollView>
        )}
      />
      {errors.category && (
        <HelperText type="error" testID="category-error">
          {errors.category.message}
        </HelperText>
      )}

      <Controller
        control={control}
        name="estimatedValue"
        rules={{
          ...(selectedCategory === 'OTHER' || selectedCategory === 'TOOLS' ? {} : {}),
          ...(selectedCategory === ('MONEY' as ItemCategory) && {
            required: t('items.estimatedValueRequired'),
          }),
          min: { value: 0, message: t('items.estimatedValueMin') },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={t('items.estimatedValue')}
            mode="outlined"
            keyboardType="decimal-pad"
            left={<TextInput.Icon icon="currency-eur" color="#A8B5BF" />}
            onBlur={onBlur}
            onChangeText={(text) => {
              const num = parseFloat(text);
              onChange(isNaN(num) ? undefined : num);
            }}
            value={value != null ? String(value) : ''}
            error={!!errors.estimatedValue}
            testID="estimatedValue-input"
            style={[styles.input, ui.input]}
            outlineStyle={styles.outline}
          />
        )}
      />
      {errors.estimatedValue && (
        <HelperText type="error" testID="estimatedValue-error">
          {errors.estimatedValue.message}
        </HelperText>
      )}

      {error && (
        <HelperText type="error" testID="form-error">
          {error}
        </HelperText>
      )}

      <Button
        mode="contained"
        icon="content-save-outline"
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        disabled={isLoading}
        testID="item-submit-btn"
        style={styles.button}
        labelStyle={styles.buttonLabel}
        contentStyle={styles.buttonContent}
      >
        {submitLabel}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  input: { marginBottom: 8 },
  outline: { borderRadius: 12 },
  categoryLabel: { color: '#2D3748', marginTop: 8, marginBottom: 8 },
  chipScroll: { marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { backgroundColor: '#EDE9E2' },
  chipSelected: { backgroundColor: '#D0E4DB' },
  chipTextSelected: { color: '#4A6355', fontWeight: '600' },
  button: { marginTop: 20, borderRadius: 12 },
  buttonLabel: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  buttonContent: { paddingVertical: 8, flexDirection: 'row-reverse' },
});
