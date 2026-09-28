import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata = {
  title: "Survei Bangkom Deputi I LAN RI",
  description: "Survei kebutuhan pengembangan kompetensi pegawai Deputi I LAN RI.",
  icons: {
    icon: [
      { url: `${basePath}/icon.png`, type: "image/png" },
    ],
    shortcut: [`${basePath}/icon.png`],
    apple: [`${basePath}/icon.png`],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href={`${basePath}/icon.png`} type="image/png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
