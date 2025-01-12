import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Layout, Menu } from "antd";
import Link from "next/link";
import "./globals.css";

const { Header, Content, Footer } = Layout;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Campaign Submission Tracker",
  description: "Track your campaign submissions and performance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const menuItems = [
    {
      key: "campaigns",
      label: <Link href="/campaigns">Campaigns</Link>,
    },
    {
      key: "performance",
      label: <Link href="/performance">Performance</Link>,
    },
  ];

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Layout className="min-h-screen">
          <Header className="bg-white border-b border-gray-200 px-4">
            <div className="container mx-auto flex justify-between items-center h-full">
              <Link href="/" className="text-xl font-bold">
                Campaign Tracker
              </Link>
              <Menu 
                mode="horizontal" 
                items={menuItems}
                className="border-none"
                defaultSelectedKeys={["campaigns"]}
              />
            </div>
          </Header>
          <Content className="container mx-auto py-6 px-4">
            <main>{children}</main>
          </Content>
          <Footer className="text-center bg-white border-t border-gray-200">
            Campaign Submission Tracker ©{new Date().getFullYear()}
          </Footer>
        </Layout>
      </body>
    </html>
  );
}
