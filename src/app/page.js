'use client';

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import img2brs, { BRICKS, MATERIALS } from 'img2brs';

const BRICK_LABELS = {
  'PB_DefaultBrick': 'Default',
  'PB_DefaultTile': 'Tile',
  'PB_DefaultSideWedge': 'Side Wedge',
  'PB_DefaultSideWedgeTile': 'Side Wedge Tile',
  'PB_DefaultWedge': 'Wedge',
  'PB_DefaultMicroBrick': 'Micro Brick',
  'PB_DefaultMicroWedge': 'Micro Wedge',
};

const MATERIAL_LABELS = {
  'BMC_Plastic': 'Plastic',
  'BMC_Glow': 'Glow',
  'BMC_Metallic': 'Metallic',
  'BMC_Hologram': 'Hologram',
};


export default function Home() {
  const [file, setFile] = useState(null);

   const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': []
    },
    onDrop: ([acceptedFile]) => {
      setFile(Object.assign(acceptedFile, {
        preview: URL.createObjectURL(acceptedFile),
      }));
    }
  });

  const onImageClick = () => {
    setFile(null);
  };

  const onFormSubmit = (e) => {
    e.preventDefault();

    const {
      brick,
      material,
      saveName,
      sizeX,
      sizeY,
      sizeZ,
      simpleDirection,
    } = Object.fromEntries(new FormData(e.target));

    const size = [Number(sizeX), Number(sizeY), Number(sizeZ)];
    img2brs(file, {
      brick,
      material,
      size,
      simpleDirection,
      saveName,
    }, true);
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <header className="row-start-1 flex gap-[24px] flex-wrap">
        <h1 className="font-medium text-2xl">🖼️ img2brs.js 🧱</h1>
      </header>
      <main className="grid grid-cols-3 grid-rows-1 gap-8 w-full">
        <div>
          <div {...getRootProps({className: 'dropzone flex flex-col items-center justify-center gap-4 rounded-2xl border border-4 dark:border-white p-8 h-full hover:cursor-pointer'})}>
            {file ?
              <div className="inline-flex rounded-md box-border" key={file.name}>
                <div className="flex relative min-w-0 overflow-hidden">
                  <button onClick={onImageClick} className="hover:cursor-pointer hover:*:visible">
                    <div className="absolute flex justify-center items-center bg-black/75 w-full h-full invisible">❌</div>
                    <img
                      src={file.preview}
                      className="block w-auto h-full"
                      // Revoke data uri after image is loaded
                      onLoad={() => { URL.revokeObjectURL(file.preview) }}
                    />
                  </button>
                </div>
              </div>
            :
              <>
                <input {...getInputProps()} />
                <p>🖱 Drag an image here 🖼️</p>
                <p>or</p>
                <p>👇 Click here to select one from your file system 📁</p>
              </>
            }
          </div>
        </div>

        <div className="col-span-2 flex gap-4 items-center justify-center flex-col sm:flex-row border border-4 dark:border-white rounded-2xl p-8">

          <form onSubmit={onFormSubmit} className="grid grid-cols-3 grid-rows-4 gap-4">
            <label className="col-start-1 row-start-1 col-span-3 row-span-1 w-full">Save Name (.brs) <input type="text" name="saveName" placeholder="Enter a save name" className="pl-2 rounded border" /></label>
            <label className="col-start-1 row-start-2 col-span-1 row-span-1">Size X <input type="text" name="sizeX" defaultValue="5" required className="pl-2 rounded border" /></label>
            <label className="col-start-2 row-start-2 col-span-1 row-span-1">Size Y <input type="text" name="sizeY" defaultValue="5" required className="pl-2 rounded border" /></label>
            <label className="col-start-3 row-start-2 col-span-1 row-span-1">Size Z <input type="text" name="sizeZ" defaultValue="2" required className="pl-2 rounded border" /></label>
            <label className="col-start-1 row-start-3 col-span-1 row-span-1">Brick
              <select name="brick" defaultValue={BRICKS[0]} className="ml-2 pl-2 rounded border dark:bg-black bg-white">
                {BRICKS.map((brick) => <option key={brick} value={brick}>{BRICK_LABELS[brick]}</option>)}
              </select>
            </label>
            <label className="col-start-2 row-start-3 col-span-1 row-span-1">Material
              <select name="material" defaultValue={MATERIALS[0]} className="ml-2 pl-2 rounded border dark:bg-black bg-white">
                {MATERIALS.map((material) => <option key={material} value={material}>{MATERIAL_LABELS[material]}</option>)}
              </select>
            </label>
            <div className="col-start-3 row-start-3 col-span-1 row-span-1">
              <label className="mr-2"><input type="radio" name="simpleDirection" value="vertical" defaultChecked={true}/> Vertical</label>
              <label><input type="radio" name="simpleDirection" value="horizontal" /> Horizontal</label>
            </div>
            <button
              type="submit"
              disabled={!file}
              className="col-start-1 row-start-4 col-span-3 row-span-1 rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            >
              🔀 Convert and Download 💾
            </button>
          </form>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://store.steampowered.com/app/2199420/Brickadia/"
          target="_blank"
          rel="noopener noreferrer"
        >
          🧱
          Play Brickadia!
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://github.com/banhathome/img2brs-js"
          target="_blank"
          rel="noopener noreferrer"
        >
          💻
          GitHub
        </a>
      </footer>
    </div>
  );
}
