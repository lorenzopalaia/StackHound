/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://stackhound.vercel.app",
  generateRobotsTxt: true,
  changefreq: "yearly",
  priority: 1,
};
