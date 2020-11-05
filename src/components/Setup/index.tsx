import { useRouter } from 'next/router';
import React, { useState } from 'react';
import Button from '../Common/Button';
import ImageFader from '../Common/ImageFader';
import SettingsPlex from '../Settings/SettingsPlex';
import SettingsServices from '../Settings/SettingsServices';
import LoginWithPlex from './LoginWithPlex';
import SetupSteps from './SetupSteps';

const Setup: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [plexSettingsComplete, setPlexSettingsComplete] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-cool-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <ImageFader
        backgroundImages={[
          '/images/rotate1.jpg',
          '/images/rotate2.jpg',
          '/images/rotate3.jpg',
          '/images/rotate4.jpg',
        ]}
      />
      <div className="px-4 sm:px-2 md:px-0 sm:mx-auto sm:w-full sm:max-w-2xl relative z-50">
        <img
          src="/logo.png"
          className="mx-auto max-h-32 w-auto mb-10"
          alt="Overseerr Logo"
        />
        <nav className="relative z-50">
          <ul
            className=" bg-cool-gray-800 bg-opacity-50 border border-cool-gray-600 rounded-md divide-y divide-cool-gray-600 md:flex md:divide-y-0"
            style={{ backdropFilter: 'blur(5px)' }}
          >
            <SetupSteps
              stepNumber={1}
              description={'Login with Plex'}
              active={currentStep === 1}
              completed={currentStep > 1}
            />
            <SetupSteps
              stepNumber={2}
              description={'Configure Plex'}
              active={currentStep === 2}
              completed={currentStep > 2}
            />
            <SetupSteps
              stepNumber={3}
              description={'Configure Services'}
              active={currentStep === 3}
              isLastStep
            />
          </ul>
        </nav>
        <div className="w-full mt-10 p-4 text-white bg-cool-gray-800 bg-opacity-50 border border-cool-gray-600 rounded-md">
          {currentStep === 1 && (
            <LoginWithPlex onComplete={() => setCurrentStep(2)} />
          )}
          {currentStep === 2 && (
            <div>
              <SettingsPlex onComplete={() => setPlexSettingsComplete(true)} />
              <div className="mt-8 border-t border-cool-gray-700 pt-5">
                <div className="flex justify-end">
                  <span className="ml-3 inline-flex rounded-md shadow-sm">
                    <Button
                      buttonType="primary"
                      disabled={!plexSettingsComplete}
                      onClick={() => setCurrentStep(3)}
                    >
                      Continue
                    </Button>
                  </span>
                </div>
              </div>
            </div>
          )}
          {currentStep === 3 && (
            <div>
              <SettingsServices />
              <div className="mt-8 border-t border-cool-gray-700 pt-5">
                <div className="flex justify-end">
                  <span className="ml-3 inline-flex rounded-md shadow-sm">
                    <Button
                      buttonType="primary"
                      onClick={() => router.push('/')}
                    >
                      Finish Setup
                    </Button>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Setup;
