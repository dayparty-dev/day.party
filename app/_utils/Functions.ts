export const navTo = (id:string, behavior:ScrollBehavior = "smooth", block:ScrollLogicalPosition = "start") => {
    const formElement = document.getElementById(id);
    if (formElement) {
    formElement.scrollIntoView({ behavior: behavior, block: block });
    }
}