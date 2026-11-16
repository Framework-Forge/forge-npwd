export interface IBankCredentials {
  name: string;
  balance: number;
}

export interface Transfer {
  id: number;
  targetID: number;
  source: string;
  type: string;
  transferAmount: number;
  message: string;
}

export interface ITransactions {
  source: number;
  type: string;
  amount: number;
}

export enum BankEvents {
  ADD_TRANSFER = 'forge-npwd:addTransfer',
  ADD_TRANSFER_SUCCESS = 'forge-npwd:addTransferSuccess',
  FETCH_TRANSACTIONS = 'forge-npwd:fetchAllTransactions',
  SEND_TRANSFERS = 'forge-npwd:sendTransfers',
  TRANSACTION_ALERT = 'forge-npwd:bankTransactionAlert',
  TRANSACTION_NOTIFICATION = 'forge-npwd:bankTransactionNotification',
  SEND_CREDENTIALS = 'forge-npwd:sendBankCredentials',
  GET_CREDENTIALS = 'forge-npwd:getBankCredentials',
  SEND_ALERT = 'forge-npwd:sendBankAlert',
  SEND_NOTIFICATION = 'forge-npwd:sendBankNotification',
}
