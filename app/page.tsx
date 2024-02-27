
 'use client'// Import necessary hooks and components from React, Next.js, and external libraries
import { useEffect, useRef, useState } from 'react';
import * as fal from '@fal-ai/serverless-client';
import { Input } from '@/components/ui/input';
import { ModelIcon } from '@/components/icons/model-icon';
import Link from 'next/link';
import Image from 'next/image'; // Import the Image component from next/image

// Default prompt used for the initial load
const DEFAULT_PROMPT = 'neuronal hyper-object white 3D  alive floating rotating tendrils blood biolumiscense transparent white background ';

// Function to generate a random seed
function randomSeed() {
  return Math.floor(Math.random() * 10000000).toFixed(0);
}

// Configuration for the FAL client
fal.config({
  proxyUrl: '/api/proxy',
});

// Default input configurations
const INPUT_DEFAULTS = {
  _force_msgpack: new Uint8Array([]),
  enable_safety_checker: true,
  image_size: 'square_hd',
  sync_mode: true,
  num_images: 1,
  num_inference_steps: '2',
};

// Main component
export default function Lightning() {
  const [image, setImage] = useState<string | null>(null); // State for the generated image, corrected type to string | null
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT); // State for the user input prompt
  const [seed, setSeed] = useState<string>(randomSeed()); // Corrected type to string
  const [inferenceTime, setInferenceTime] = useState<number>(NaN); // State to store inference time

  // Ref for managing the interval ID
  const timer = useRef<NodeJS.Timeout>();

  // Establish a connection to the FAL server
  const connection = useRef(fal.realtime.connect('fal-ai/fast-lightning-sdxl', {
    connectionKey: 'lightning-sdxl',
    throttleInterval: 64,
    onResult: (result) => {
      const blob = new Blob([result.images[0].content], { type: 'image/jpeg' });
      setImage(URL.createObjectURL(blob));
      setInferenceTime(result.timings.inference);
    },
  })).current;

  // Handle changes in the prompt input by the user
  const handleOnChange = (prompt: string) => {
    setPrompt(prompt);
    const input = {
      ...INPUT_DEFAULTS,
      prompt: prompt,
      seed: Number(seed),
    };
    connection.send(input);
  };

  // Effect hook for initial load and setting up the seed update interval
  useEffect(() => {
    // Set cookie for initial setup
    if (typeof window !== 'undefined') {
      window.document.cookie = 'fal-app=true; path=/; samesite=strict; secure;';
    }

    // Send initial request
    connection.send({
      ...INPUT_DEFAULTS,
      num_inference_steps: '4',
      prompt: prompt,
      seed: Number(seed),
    });

    // Setup interval to update the seed every 500 milliseconds
    const seedUpdateInterval = setInterval(() => {
      setSeed(randomSeed());
    }, 500);

    // Cleanup interval on component unmount
    return () => clearInterval(seedUpdateInterval);
  }, [connection, prompt, seed]); // Added dependencies based on ESLint recommendation

  // Render the component UI
  return (
    <main>
      <div className="container py-4 px-1.5 space-y-4 lg:space-y-8 mx-auto">
        <div className="flex flex-col space-y-2">
          <div className="flex flex-col max-md:space-y-4 md:flex-row md:space-x-4">
            <div className="flex-1 space-y-1">
              <label>Prompt</label>
              <Input
                onChange={(e) => handleOnChange(e.target.value)}
                className="font-light w-full"
                placeholder="Type something..."
                value={prompt}
              />
            </div>
            <div className="space-y-1">
              <label>Seed</label>
              <Input
                onChange={(e) => {
                  setSeed(e.target.value);
                  handleOnChange(prompt);
                }}
                className="font-light w-full"
                placeholder="random"
                type="number"
                value={seed}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col space-y-6 lg:flex-row lg:space-y-0">
          <div className="flex-1 flex-col flex items-center justify-center">
            {image && inferenceTime && (
              <div className="flex flex-row space-x-1">
                <span>inference time</span>
                <strong>{inferenceTime ? `${(inferenceTime * 1000).toFixed(0)}ms` : `n/a`}</strong>
              </div>
            )}
            <div className="min-h-[512px] max-w-fit">
              {image && (
                // Replace <img> with <Image> component from next/image for optimization
                <Image src={image} alt="Dynamic Image" width={500} height={500} layout='responsive' />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="container flex flex-col items-center justify-center my-4">
        <p className="text-sm text-base-content/70 py-4 text-center">
          This playground is hosted on <strong><a href="https://fal.ai" className="underline" target="_blank">fal.ai</a></strong> and is for demonstration purposes only.
        </p>
        <div className="flex flex-row items-center space-x-2">
          <span className="text-xs font-mono">powered by</span>
          <Link href="https://fal.ai" target="_blank">
            <ModelIcon />
          </Link>
        </div>
      </div>
    </main>
  );
}
