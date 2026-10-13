import { useTranslation } from 'react-i18next';
import { ForgeNPWDButton } from '@forge-npwd/keyos';

export const ControlButtons = ({ showImagePrompt, showEmoji, onCloseClick, onPrimaryClick }) => {
  const [t] = useTranslation();

  const imagePromptVisible = showImagePrompt && !showEmoji;
  const primaryButtonText = imagePromptVisible ? t('TWITTER.SUBMIT_IMAGE') : t('TWITTER.TWEET');
  const showCloseButton = showImagePrompt || showEmoji;

  return (
    <div className="flex flex-row items-center justify-end space-x-2">
      <ForgeNPWDButton variant="primary" size="sm" onClick={onPrimaryClick} className="bg-sky-500">
        {primaryButtonText}
      </ForgeNPWDButton>
      {showCloseButton && (
        <ForgeNPWDButton className="bg-red-500" variant="primary" size="sm" onClick={onCloseClick}>
          {t('GENERIC.CLOSE')}
        </ForgeNPWDButton>
      )}
    </div>
  );
};

export default ControlButtons;
