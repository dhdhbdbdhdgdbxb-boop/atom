import LocaleChecker from '../../components/LocaleChecker';

export default function RussianLayout({ children }) {
  return (
    <>
      <LocaleChecker currentLocale="ru" />
      {children}
    </>
  );
}