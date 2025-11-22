import React from 'react';

export const PrintStyles: React.FC = () => (
  <style>{`
    @media print {
      /* Oculta todo por defecto al imprimir */
      body * {
        visibility: hidden;
        height: 0;
        overflow: hidden;
        margin: 0;
        padding: 0;
      }

      /* Muestra solo la sección de impresión y sus hijos */
      #print-section, #print-section * {
        visibility: visible;
        height: auto;
        overflow: visible;
        margin: unset;
        padding: unset;
      }

      /* Ajusta la sección de impresión para que ocupe la página */
      #print-section {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        padding: 2rem;
      }

      .no-print {
          display: none !important;
      }
    }
  `}</style>
);
