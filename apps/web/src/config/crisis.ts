// Контакты помощи на кризисном экране.
// TODO: проверить актуальность — номера заполняет и проверяет человек перед пилотом.
export interface CrisisContact {
  title: string;
  phone: string; // для tel:
  display: string;
  note?: string;
}

export const EMERGENCY: CrisisContact = {
  title: 'Экстренные службы',
  phone: '112',
  display: '112',
  note: 'Бесплатно, круглосуточно, с любого телефона',
};

export const CRISIS_CONTACTS: CrisisContact[] = [
  {
    // TODO: проверить актуальность
    title: 'Экстренная психологическая помощь МЧС России',
    phone: '+74959895050',
    display: '+7 495 989-50-50',
    note: 'Круглосуточно',
  },
  {
    // TODO: проверить актуальность
    title: 'Московская служба психологической помощи',
    phone: '051',
    display: '051 (с мобильного: +7 495 051)',
    note: 'Круглосуточно',
  },
  {
    // TODO: проверить актуальность
    title: 'Телефон доверия для детей, подростков и их родителей',
    phone: '88002000122',
    display: '8 800 2000 122',
    note: 'Бесплатно',
  },
];
