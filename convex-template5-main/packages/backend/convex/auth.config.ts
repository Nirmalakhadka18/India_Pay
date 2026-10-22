export default {
  providers: [
    {
      domain:
        process.env.CONVEX_SITE_URL ||
        "https://basic-bobcat-92.convex.site",
      applicationID: "convex",
    },
  ],
};
