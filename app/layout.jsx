import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata = {
  title: "Survei Bangkom Deputi I LAN RI",
  description: "Survei kebutuhan pengembangan kompetensi pegawai Deputi I LAN RI.",
  icons: {
    icon: [
      { url: `${basePath}/icon.svg`, type: "image/svg+xml" },
    ],
    shortcut: [`${basePath}/icon.svg`],
    apple: [`${basePath}/icon.svg`],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href={`${basePath}/icon.svg`} type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  );
}
