export const metadata = {
  title: 'FARO — Tu Copiloto Financiero',
  description: 'Controla tus finanzas con inteligencia artificial. Sabe exactamente cuánto necesitas cada mes.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        <meta name="theme-color" content="#0F4C81"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      </head>
      <body style={{margin:0, padding:0, fontFamily:"'DM Sans', sans-serif"}}>
        {children}
      </body>
    </html>
  )
}
