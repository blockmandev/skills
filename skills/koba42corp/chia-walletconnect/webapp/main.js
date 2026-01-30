import { SignClient } from '@walletconnect/sign-client';
import { WalletConnectModal } from '@walletconnect/modal';
import { getSdkError } from '@walletconnect/utils';

const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}

const WALLETCONNECT_PROJECT_ID = '2ed47e4a0beba1f91fce9b103ddc958d';
const CHIA_CHAIN = 'chia:mainnet';

let signClient = null;
let wcModal = null;
let currentSession = null;
let currentAddress = null;
let currentPublicKey = null;
let challengeData = null;
let elements = {};

async function init() {
  console.log('🚀 Initializing Chia Wallet Verification...');
  
  elements = {
    statusBadge: document.getElementById('status-badge'),
    statusText: document.getElementById('status-text'),
    connectBtn: document.getElementById('connect-btn'),
    connectSection: document.getElementById('connect-section'),
    walletInfo: document.getElementById('wallet-info'),
    walletAddress: document.getElementById('wallet-address'),
    walletPubkey: document.getElementById('wallet-pubkey'),
    challengeSection: document.getElementById('challenge-section'),
    challengeMessage: document.getElementById('challenge-message'),
    signBtn: document.getElementById('sign-btn'),
    resultSection: document.getElementById('result-section'),
    resultCard: document.getElementById('result-card'),
    resultIcon: document.getElementById('result-icon'),
    resultMessage: document.getElementById('result-message'),
    resultDetails: document.getElementById('result-details'),
    errorSection: document.getElementById('error-section'),
    errorMessage: document.getElementById('error-message'),
    retryBtn: document.getElementById('retry-btn'),
    loadingOverlay: document.getElementById('loading-overlay'),
    loadingText: document.getElementById('loading-text')
  };
  
  elements.connectBtn.addEventListener('click', connectWallet);
  elements.signBtn.addEventListener('click', signChallenge);
  elements.retryBtn.addEventListener('click', reset);
  
  await initWalletConnect();
}

async function initWalletConnect() {
  try {
    showLoading('Initializing WalletConnect...');
    console.log('🔗 Initializing WalletConnect SignClient...');
    
    signClient = await SignClient.init({
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: 'Chia Wallet Verification',
        description: 'Verify Chia wallet ownership via Telegram',
        url: window.location.origin,
        icons: ['https://chia.net/wp-content/uploads/2022/09/chia-logo.svg']
      }
    });
    
    console.log('✅ SignClient initialized');
    
    wcModal = new WalletConnectModal({
      projectId: WALLETCONNECT_PROJECT_ID,
      chains: [CHIA_CHAIN],
      themeMode: 'dark'
    });
    
    console.log('✅ Modal initialized');
    
    // Check for existing sessions
    const sessions = signClient.session.getAll();
    if (sessions.length > 0) {
      console.log('📱 Found existing session');
      currentSession = sessions[0];
      await handleSessionConnected(currentSession);
    }
    
    hideLoading();
    
  } catch (error) {
    console.error('❌ WalletConnect init failed:', error);
    showError('Failed to initialize: ' + error.message);
    hideLoading();
  }
}

async function connectWallet() {
  try {
    console.log('🔗 Connecting wallet...');
    showLoading('Opening WalletConnect...');
    setStatus('connecting', 'Connecting...');
    
    const { uri, approval } = await signClient.connect({
      optionalNamespaces: {
        chia: {
          methods: ['chip0002_getPublicKeys', 'chip0002_signMessage'],
          chains: [CHIA_CHAIN],
          events: []
        }
      }
    });
    
    if (uri) {
      console.log('🔗 Opening modal with URI');
      await wcModal.openModal({ uri });
      
      // Hide loading so QR code is visible
      hideLoading();
    }
    
    const session = await approval();
    console.log('✅ Session approved');
    
    wcModal.closeModal();
    
    currentSession = session;
    await handleSessionConnected(session);
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
    wcModal?.closeModal();
    showError('Connection failed: ' + error.message);
    setStatus('disconnected', 'Disconnected');
    hideLoading();
  }
}

async function handleSessionConnected(session) {
  try {
    showLoading('Fetching wallet info...');
    
    const accounts = session.namespaces.chia?.accounts || [];
    if (accounts.length === 0) {
      throw new Error('No accounts found');
    }
    
    currentAddress = accounts[0].split(':')[2];
    console.log('💼 Connected:', currentAddress);
    
    try {
      const pubKeys = await signClient.request({
        topic: session.topic,
        chainId: CHIA_CHAIN,
        request: {
          method: 'chip0002_getPublicKeys',
          params: { limit: 1, offset: 0 }
        }
      });
      
      if (pubKeys && pubKeys.length > 0) {
        currentPublicKey = pubKeys[0];
        console.log('🔑 Public key obtained');
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch public key');
    }
    
    elements.walletAddress.textContent = currentAddress;
    elements.walletPubkey.textContent = currentPublicKey || 'Not available';
    
    setStatus('connected', 'Connected');
    elements.connectSection.classList.add('hidden');
    elements.walletInfo.classList.remove('hidden');
    
    generateChallenge();
    hideLoading();
    
  } catch (error) {
    console.error('❌ Session handling failed:', error);
    showError('Failed to process wallet: ' + error.message);
    hideLoading();
  }
}

function generateChallenge() {
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).substring(2, 15);
  const userId = tg?.initDataUnsafe?.user?.id || 'telegram_user';
  
  const message = `Verify ownership of Chia wallet:\n${currentAddress}\n\nTimestamp: ${timestamp}\nNonce: ${nonce}\nUser: ${userId}`;
  
  challengeData = { message, nonce, timestamp, address: currentAddress, userId };
  
  elements.challengeMessage.textContent = message;
  elements.challengeSection.classList.remove('hidden');
  
  console.log('📝 Challenge generated');
}

async function signChallenge() {
  try {
    showLoading('Requesting signature...');
    elements.signBtn.disabled = true;
    
    // CHIP-0002 requires publicKey parameter
    const signingParams = {
      message: challengeData.message
    };
    
    // Add publicKey if we have it
    if (currentPublicKey) {
      signingParams.publicKey = currentPublicKey;
    }
    
    console.log('📝 Signing params:', signingParams);
    
    const signature = await signClient.request({
      topic: currentSession.topic,
      chainId: CHIA_CHAIN,
      request: {
        method: 'chip0002_signMessage',
        params: signingParams
      }
    });
    
    console.log('✍️ Signature received:', signature);
    
    await verifySignature(signature);
    
  } catch (error) {
    console.error('❌ Signing failed:', error);
    showError('Signing failed: ' + (error.message || JSON.stringify(error)));
    elements.signBtn.disabled = false;
    hideLoading();
  }
}

async function verifySignature(signature) {
  try {
    showLoading('Submitting...');
    
    const verificationData = {
      address: currentAddress,
      message: challengeData.message,
      signature: signature,
      publicKey: currentPublicKey,
      userId: challengeData.userId,
      timestamp: challengeData.timestamp
    };
    
    console.log('📤 Sending to bot');
    
    if (tg && tg.sendData) {
      tg.sendData(JSON.stringify(verificationData));
    }
    
    showResult({
      verified: true,
      message: 'Signature Submitted!',
      details: `Wallet: ${currentAddress}\n\nVerification sent to bot.`
    });
    
    hideLoading();
    
    setTimeout(() => {
      if (tg && tg.close) tg.close();
    }, 3000);
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    showError('Verification failed: ' + error.message);
    hideLoading();
  }
}

function setStatus(type, text) {
  elements.statusBadge.className = `status-badge ${type}`;
  elements.statusText.textContent = text;
}

function showLoading(text) {
  elements.loadingText.textContent = text;
  elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
  elements.loadingOverlay.classList.add('hidden');
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorSection.classList.remove('hidden');
}

function showResult(result) {
  elements.challengeSection.classList.add('hidden');
  elements.resultSection.classList.remove('hidden');
  
  if (result.verified) {
    elements.resultCard.classList.add('success');
    elements.resultIcon.textContent = '✅';
  } else {
    elements.resultCard.classList.add('error');
    elements.resultIcon.textContent = '❌';
  }
  
  elements.resultMessage.textContent = result.message;
  elements.resultDetails.textContent = result.details || '';
}

function reset() {
  if (signClient && currentSession) {
    signClient.disconnect({
      topic: currentSession.topic,
      reason: getSdkError('USER_DISCONNECTED')
    });
  }
  
  currentSession = null;
  currentAddress = null;
  currentPublicKey = null;
  challengeData = null;
  
  elements.connectSection.classList.remove('hidden');
  elements.walletInfo.classList.add('hidden');
  elements.challengeSection.classList.add('hidden');
  elements.resultSection.classList.add('hidden');
  elements.errorSection.classList.add('hidden');
  elements.resultCard.classList.remove('success', 'error');
  elements.signBtn.disabled = false;
  
  setStatus('disconnected', 'Disconnected');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('🌱 Chia Wallet Verification loaded');
