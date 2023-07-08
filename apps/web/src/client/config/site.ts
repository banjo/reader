export const siteConfig = {
    name: "Banjo RSS",
    description:
        "A super simple RSS feed reader. Not much more than that actually.",
    mainNav: [
        {
            title: "Dashboard",
            href: "/dashboard",
            public: false,
        },
    ],
    links: {
        twitter: "https://twitter.com/banjo_dev",
        github: "https://github.com/banjo",
    },
};

export type SiteConfig = typeof siteConfig;
