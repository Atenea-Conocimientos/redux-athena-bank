import { useCallback } from 'react';
import { loadFull } from 'tsparticles';
import { Engine, Container } from 'tsparticles-engine';
import Particles from 'react-tsparticles';

const NeonParticlesBackground = () => {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
      }}
      options={{
        background: {
          color: '#14002e',
        },
        fullScreen: { enable: false },
        fpsLimit: 60,
        particles: {
          number: { value: 70, density: { enable: true, area: 900 } },
          color: { value: ['#a259ff', '#1bffff', '#fff', '#7c3aed'] },
          shape: { type: 'circle' },
          opacity: {
            value: 0.6,
            anim: { enable: true, speed: 0.7, opacity_min: 0.2, sync: false },
          },
          size: {
            value: 4,
            random: { enable: true, minimumValue: 2 },
            anim: { enable: true, speed: 2, size_min: 1, sync: false },
          },
          links: {
            enable: true,
            distance: 130,
            color: '#a259ff',
            opacity: 0.25,
            width: 2,
            shadow: {
              enable: true,
              color: '#a259ff',
              blur: 10,
            },
          },
          move: {
            enable: true,
            speed: 1.5,
            direction: 'none',
            random: false,
            straight: false,
            outModes: { default: 'out' },
            attract: { enable: false },
          },
        },
        detectRetina: true,
      }}
    />
  );
};

export default NeonParticlesBackground;
