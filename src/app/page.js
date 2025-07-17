'use client';

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import brs from 'brs-js';

const BRICKS = [
  {
    label: 'Default',
    value: 'PB_DefaultBrick',
  },
  {
    label: 'Tile',
    value: 'PB_DefaultTile',
  },
  {
    label: 'Side Wedge',
    value: 'PB_DefaultSideWedge',
  },
  {
    label: 'Side Wedge Tile',
    value: 'PB_DefaultSideWedgeTile',
  },
  {
    label: 'Wedge',
    value: 'PB_DefaultWedge',
  },
  {
    label: 'Micro Brick',
    value: 'PB_DefaultMicroBrick',
  },
  {
    label: 'Micro Wedge',
    value: 'PB_DefaultMicroWedge',
  }
];

const MATERIALS = [
  {
    label: 'Plastic',
    value: 'BMC_Plastic',
  },
  {
    label: 'Glow',
    value: 'BMC_Glow',
  },
  {
    label: 'Metallic',
    value: 'BMC_Metallic',
  },
  {
    label: 'Hologram',
    value: 'BMC_Hologram',
  },
];

const directionMap = {
  vertical: 2, // Y Positive
  horizontal: 4, // Z Positive
};

// Brickadia uses linear RGB and the image formats we support use sRGB
// Formula copied from https://physicallybased.info/tools/
function srgbToLinear(srgb) {
    const normalized = srgb / 255.0;
    if (normalized > 0.04045) {
        return Math.pow((normalized / 1.055) + 0.0521327014, 2.4) * 255.0;
    } else {
        return (normalized / 12.92) * 255.0;
    }
}

function pixelToBrick(x, y, pixelRgba, size, direction, imgHeight) {
  const { r, g, b, a } = pixelRgba;
  const isVertical = direction === 'vertical';

  // Calculations taken from the original img2brs by mraware
  const newX = isVertical ? x * size[1] * 2 + size[1] : x * size[0] * 2 + size[0];
  const newY = isVertical ? y * size[0] * 2 + size[0] : y * size[1] * 2 + size[1];
  const position = isVertical ? [newX, size[2], -newY + (imgHeight * size[0] * 2)] : [newX, newY, size[2]];

  return {
    color: [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b), a],
    size,
    direction: directionMap[direction],
    position,

    asset_name_index: 0, // always zero because brick_assets array in save file will only consist of the selected brick
    material_index: 0,  // always zero because materials array in save file will only consist of the selected brick
    rotation: 0,
    collision: true,
    visibility: true,
  };
}

function ue4DateTimeBase() {
  // January 1, 0001 in JavaScript Date
  // Note: JavaScript Date minimum is around 1970, so we calculate the offset
  // UE4 epoch is 621355968000000000 ticks before Unix epoch (1970-01-01)
  const unixEpochTicks = 621355968000000000n; // 100-nanosecond ticks from 0001-01-01 to 1970-01-01
  return unixEpochTicks;
}

function getSaveTime() {
  // Convert JavaScript Date to milliseconds since Unix epoch
  const unixTimestampMs = new Date().getTime();

  // Convert to nanoseconds
  const unixTimestampNs = BigInt(unixTimestampMs) * 1000000n;

  // Get the UE4 base offset (ticks from 0001-01-01 to 1970-01-01)
  const ue4BaseOffset = ue4DateTimeBase();

  // Calculate total ticks since UE4 epoch (0001-01-01)
  // UE4 uses 100-nanosecond ticks, so divide by 100
  const totalNanoseconds = unixTimestampNs;
  const totalTicks = totalNanoseconds / 100n; // Convert to 100-nanosecond ticks
  const ue4Ticks = ue4BaseOffset + totalTicks;

  // Convert to 8-byte Little Endian array
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);

  // Write as signed 64-bit integer in Little Endian format
  view.setBigInt64(0, ue4Ticks, true); // true = Little Endian

  return new Uint8Array(buffer);
}


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
      direction,
    } = Object.fromEntries(new FormData(e.target));

    const _saveName = !!saveName ? saveName : 'default.brs';

    const size = [Number(sizeX), Number(sizeY), Number(sizeZ)];

    const img = new Image();
    img.src = file.preview;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx?.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const pixelBricks = [];
    for (let x = 0; x < canvas.width; x++) {
      for (let y = 0; y < canvas.height; y++) {
        const index = (y * canvas.width + x) * 4;
        const pixelRgba = {
          r: pixels[index],
          g: pixels[index + 1],
          b: pixels[index + 2],
          a: pixels[index + 3]
        };

        if (pixelRgba.a > 0) {
          pixelBricks.push(pixelToBrick(x, y, pixelRgba, size, direction, canvas.height));
        }
      }
    }

    const writeData = {
      description: 'Generated with img2brs.js',
      save_time: getSaveTime(),
      brick_assets: [brick],
      materials: [material],
      bricks: pixelBricks,
    };

    const blob = new Blob([brs.write(writeData)]);
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = _saveName.endsWith('.brs') ? _saveName : `${_saveName}.brs`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <header className="row-start-1 flex gap-[24px] flex-wrap">
        <h1 className="font-medium text-2xl">🖼️ img2brs.js 🧱</h1>
      </header>
      <main className="grid grid-cols-3 grid-rows-1 gap-8 w-full">
        <div>
          <div {...getRootProps({className: 'dropzone flex flex-col items-center justify-center gap-4 rounded-2xl border border-white p-4 h-full hover:cursor-pointer'})}>
            {file ?
              <div className="inline-flex rounded-md m-8 p-4 box-border" key={file.name}>
                <div className="flex relative min-w-0 overflow-hidden">
                  <button onClick={onImageClick} className="*:hover:visible">
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

        <div className="col-span-2 flex gap-4 items-center justify-center flex-col sm:flex-row border border-white rounded-2xl p-4">

          <form onSubmit={onFormSubmit} className="grid grid-cols-3 grid-rows-4 gap-4">
            <label className="col-start-1 row-start-1 col-span-3 row-span-1 w-full">Save Name (.brs) <input type="text" name="saveName" placeholder="Enter a save name" className="pl-2 rounded border" /></label>
            <label className="col-start-1 row-start-2 col-span-1 row-span-1">Size X <input type="text" name="sizeX" defaultValue="5" required className="pl-2 rounded border" /></label>
            <label className="col-start-2 row-start-2 col-span-1 row-span-1">Size Y <input type="text" name="sizeY" defaultValue="5" required className="pl-2 rounded border" /></label>
            <label className="col-start-3 row-start-2 col-span-1 row-span-1">Size Z <input type="text" name="sizeZ" defaultValue="2" required className="pl-2 rounded border" /></label>
            <label className="col-start-1 row-start-3 col-span-1 row-span-1">Brick
              <select name="brick" defaultValue={BRICKS[0].label} className="ml-2 pl-2 rounded border dark:bg-black bg-white">
                {BRICKS.map(({ label, value }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="col-start-2 row-start-3 col-span-1 row-span-1">Material
              <select name="material" defaultValue={MATERIALS[0].label} className="ml-2 pl-2 rounded border dark:bg-black bg-white">
                {MATERIALS.map(({ label, value }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <div className="col-start-3 row-start-3 col-span-1 row-span-1">
              <label className="mr-2"><input type="radio" name="direction" value="vertical" defaultChecked={true}/> Vertical</label>
              <label><input type="radio" name="direction" value="horizontal" /> Horizontal</label>
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
