import "./globals.css";

export const metadata = {
  title: "Survei Bangkom Deputi I LAN RI",
  description: "Survei kebutuhan pengembangan kompetensi pegawai Deputi I LAN RI.",
};

export default function RootLayout({ children }) {
  return <html lang="id"><body>{children}</body></html>;
}
