import React, { useState } from 'react';
import DialogForm from '@ui/components/DialogForm';
import { TextField } from '@ui/components/Input';
import { useSnackbar } from '@os/snackbar/hooks/useSnackbar';
import { changePhonePin } from '@os/security/security.api';
import { PHONE_PIN_MAX_LENGTH, PHONE_PIN_MIN_LENGTH } from '@typings/security';

interface ChangePinModalProps {
  open: boolean;
  onClose: () => void;
}

const validPin = (value: string) => new RegExp(`^\\d{${PHONE_PIN_MIN_LENGTH},${PHONE_PIN_MAX_LENGTH}}$`).test(value);

export const ChangePinModal: React.FC<ChangePinModalProps> = ({ open, onClose }) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addAlert } = useSnackbar();

  const close = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmation('');
    onClose();
  };

  const submit = async () => {
    if (!validPin(currentPin) || !validPin(newPin)) {
      return addAlert({ message: 'A senha deve ter entre 4 e 6 números.', type: 'error' });
    }
    if (newPin !== confirmation) {
      return addAlert({ message: 'A confirmação da nova senha não confere.', type: 'error' });
    }
    setSubmitting(true);
    const response = await changePhonePin(currentPin, newPin);
    setSubmitting(false);
    if (response.status !== 'ok') {
      if (response.data?.lockedUntil) window.dispatchEvent(new Event('forge-npwd-security-refresh'));
      return addAlert({
        message: response.data?.lockedUntil
          ? 'Muitas tentativas. O aparelho foi bloqueado temporariamente.'
          : response.errorMsg === 'INVALID_CURRENT_PIN'
            ? 'A senha atual está incorreta.'
            : 'Não foi possível alterar a senha.',
        type: 'error',
      });
    }
    addAlert({ message: 'Senha do aparelho alterada.', type: 'success' });
    close();
  };

  const inputProps = { inputMode: 'numeric' as const, maxLength: PHONE_PIN_MAX_LENGTH };

  return (
    <DialogForm
      open={open}
      handleClose={close}
      onSubmit={submit}
      title="Alterar senha do aparelho"
      content="Informe a senha atual e escolha uma nova senha de 4 a 6 números."
    >
      <div className="flex flex-col gap-3 pt-3">
        <TextField label="Senha atual" type="password" value={currentPin} inputProps={inputProps} onChange={(event) => setCurrentPin(event.target.value.replace(/\D/g, ''))} fullWidth />
        <TextField label="Nova senha" type="password" value={newPin} inputProps={inputProps} onChange={(event) => setNewPin(event.target.value.replace(/\D/g, ''))} fullWidth />
        <TextField label="Confirmar nova senha" type="password" value={confirmation} inputProps={inputProps} onChange={(event) => setConfirmation(event.target.value.replace(/\D/g, ''))} fullWidth />
        {submitting && <span className="text-xs text-neutral-500">Salvando...</span>}
      </div>
    </DialogForm>
  );
};
