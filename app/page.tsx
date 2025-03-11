import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      {/* Navbar */}
      {/* <div className="navbar bg-primary text-primary-content shadow-lg px-6"> */}
      <div className="navbar bg-primary text-primary-content shadow-lg px-6 flex justify-center">
        <a className="text-2xl font-bold tracking-wide">Day.Party</a>
      </div>
      {/* <div className="navbar-end hidden md:flex gap-4">
          <a className="btn btn-ghost hover:bg-secondary hover:text-white">Inicio</a>
          <a className="btn btn-ghost hover:bg-secondary hover:text-white">Características</a>
          <a className="btn btn-ghost hover:bg-secondary hover:text-white">Contacto</a>
        </div> */}
      {/* </div> */}

      {/* Hero Section */}
      <div className="hero py-20 text-center flex flex-col items-center">
        <div className="hero-content flex flex-col md:flex-row items-center">
          <div className="md:w-1/2">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Organiza tu vida, <span className="text-secondary">jugando</span>
            </h1>
            <p className="mt-4 text-lg">
              Convierte tus tareas en misiones, gana recompensas y sube de nivel
              en la vida.
            </p>
            <button className="btn btn-secondary mt-6">Empieza ahora</button>
          </div>
          <Image
            src="/images/dayparty_hero.png"
            alt="Day.party gamified productivity app"
            width={384}
            height={384}
            priority
            className="mt-6 md:mt-0 w-80 md:w-96"
          />
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16 grid md:grid-cols-3 gap-8">
        <div className="card bg-base-100 shadow-xl transform hover:scale-105 transition-transform">
          <div className="card-body">
            <h2 className="card-title">🎮 Gamificación Total</h2>
            <p>
              Convierte tu día en un juego con retos, lootboxes y recompensas.
            </p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-xl transform hover:scale-105 transition-transform">
          <div className="card-body">
            <h2 className="card-title">🧠 Neurospicy Friendly</h2>
            <p>
              Diseñado para mentes inquietas: flexibilidad total y sin presión.
            </p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-xl transform hover:scale-105 transition-transform">
          <div className="card-body">
            <h2 className="card-title">💡 Personalización</h2>
            <p>
              Cambia el look de tu agenda con skins diarios y modos visuales
              únicos.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center py-10 bg-secondary text-secondary-content relative">
        <div className="absolute inset-0 bg-secondary bg-opacity-30 blur-lg"></div>
        <div className="relative">
          <h2 className="text-4xl font-bold">
            ¿Listo para mejorar tu productividad?
          </h2>
          <p className="mt-2">
            Únete ahora y descubre una nueva forma de organizar tu vida.
          </p>
          <button className="btn btn-primary mt-4">Únete ahora</button>
        </div>
      </div>
    </div>
  );
}
