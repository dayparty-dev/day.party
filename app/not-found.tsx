import Link from "next/link";

export default function NotFound() {
    return (
        <div className="w-full h-screen flex flex-col justify-center text-center">
            <h2 className="text-xl font-bold">Not found :(</h2>
            <Link href="/">Home</Link>
        </div>
    );
}