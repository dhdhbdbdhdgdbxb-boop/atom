import LocaleChecker from '../../components/LocaleChecker';

export default function EnglishLayout({ children }) {
  return (
    <>
      <LocaleChecker currentLocale="en" />
      {children}
    </>
  );
}