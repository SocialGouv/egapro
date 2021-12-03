const styles = {
  styles: {
    global: {
      "@font-face": [
        {
          fontFamily: "Cabin",
          fontStyle: "normal",
          fontWeight: "normal",
          src:
            "url('cabin-v14-latin-regular-webfont.woff2') format('woff2')," +
            " url('cabin-v14-latin-regular-webfont.woff') format('woff')",
        },
        {
          fontFamily: "Gabriela",
          fontStyle: "normal",
          fontWeight: "normal",
          src:
            "url('gabriela-v8-latin-regular.woff2') format('woff2')," +
            " url('gabriela-v8-latin-regular.woff') format('woff')",
        },
      ],
      "html, body, #root": {
        height: "100%",
      },
      body: {
        fontFamily: '"Cabin", -apple-system, sans-serif',
        fontWeight: "normal",
        color: "gray.700",
      },
      "#root": {
        background: "linear-gradient(#eff0fa,#fff)",
      },
      a: {
        color: "primary.500",
      },
    },
  },
}
export default styles
