import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "재린월드";
const description = "우리 가족의 이야기를 기록합니다.";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: appName,
    template: `%s | ${appName}`,
  },
  description,
  applicationName: appName,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: appUrl,
    siteName: appName,
    title: appName,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: appName,
    description,
  },
  alternates: {
    types: {
      "application/rss+xml": `${appUrl}/rss.xml`,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
