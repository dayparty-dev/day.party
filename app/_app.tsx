import { appWithTranslation } from 'next-i18next'
import i18n from "./i18n"
const MyApp = ({ Component, pageProps }) => (
    <Component {...pageProps} />
)

export default appWithTranslation(MyApp)