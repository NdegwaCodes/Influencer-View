/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    'antd',
    '@ant-design',
    'rc-util',
    'rc-pagination',
    'rc-picker',
    'rc-input',
    'rc-textarea',
    'rc-select',
    '@rc-component'
  ],
}

module.exports = nextConfig
