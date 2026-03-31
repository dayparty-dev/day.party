"use client";

import a from "../i18n"; // Importa la inicialización
import { useTranslation } from "react-i18next";
import { FaGlobe } from "react-icons/fa";

export default function LangBubble() {
    const { i18n } = useTranslation("", { "i18n": a });
    console.log("i18n", i18n);

    const changeLanguage = (locale: string) => {
        i18n.changeLanguage(locale);
        localStorage.setItem("prefLocale", locale); // Guarda el idioma seleccionado
        console.log("Lang", locale);
    };

    return (
        <div>
            <div className="dropdown dropdown-top dropdown-start">
                <label tabIndex={0} className="btn btn-circle btn-primary">
                    <FaGlobe className="text-xl" />
                </label>
                <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-28">
                    <li>
                        <button onClick={() => changeLanguage("en")}>🇺🇸 English</button>
                    </li>
                    <li>
                        <button onClick={() => changeLanguage("es")}>🇪🇸 Español</button>
                    </li>
                </ul>
            </div>
        </div>
    );
}