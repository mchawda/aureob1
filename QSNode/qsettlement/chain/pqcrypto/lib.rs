// SPDX-License-Identifier: MIT

//! Quantum Settlement Node PQC Integration
//! 
//! This module integrates Post-Quantum Cryptography (PQC) primitives
//! from QSmart into the Quantum Settlement Node validator infrastructure.

use anyhow::Result;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;

// Import QSmart crypto primitives
use qsmart_crypto::{
    QuantumKeyBundle, DilithiumKeyPair, KyberKeyPair,
    generate_dilithium_keys, generate_kyber_keys,
    sign_dilithium, verify_dilithium
};

/// PQC Validator Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PQCValidatorConfig {
    pub name: String,
    pub address: String,
    pub voting_power: u64,
    pub commission_rate: f64,
    pub quantum_keys: QuantumKeyBundle,
}

/// PQC Network State
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PQCNetworkState {
    pub validators: HashMap<String, PQCValidatorConfig>,
    pub current_height: u64,
    pub consensus_params: ConsensusParams,
}

/// Consensus Parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsensusParams {
    pub block_time_ms: u64,
    pub max_validators: u32,
    pub min_stake: u64,
    pub unbonding_period_days: u32,
}

/// PQC Validator Manager
pub struct PQCValidatorManager {
    config: PQCValidatorConfig,
    network_state: PQCNetworkState,
}

impl PQCValidatorManager {
    /// Create a new PQC validator manager
    pub fn new(name: String, address: String) -> Result<Self> {
        let quantum_keys = QuantumKeyBundle::generate()?;
        
        let config = PQCValidatorConfig {
            name: name.clone(),
            address,
            voting_power: 1000000,
            commission_rate: 0.05,
            quantum_keys,
        };
        
        let network_state = PQCNetworkState {
            validators: HashMap::new(),
            current_height: 0,
            consensus_params: ConsensusParams {
                block_time_ms: 1000,
                max_validators: 100,
                min_stake: 1000000,
                unbonding_period_days: 21,
            },
        };
        
        Ok(Self {
            config,
            network_state,
        })
    }
    
    /// Generate quantum keys for validator
    pub fn generate_validator_keys(&mut self) -> Result<()> {
        self.config.quantum_keys = QuantumKeyBundle::generate()?;
        Ok(())
    }
    
    /// Sign a block proposal with Dilithium
    pub fn sign_block_proposal(&self, block_data: &[u8]) -> Result<Vec<u8>> {
        self.config.quantum_keys.sign_dilithium(block_data)
    }
    
    /// Verify a block signature
    pub fn verify_block_signature(
        &self,
        block_data: &[u8],
        signature: &[u8],
        validator_address: &str,
    ) -> Result<bool> {
        if let Some(validator) = self.network_state.validators.get(validator_address) {
            validator.quantum_keys.verify_dilithium(block_data, signature)
        } else {
            Ok(false)
        }
    }
    
    /// Add validator to network
    pub fn add_validator(&mut self, validator: PQCValidatorConfig) -> Result<()> {
        if self.network_state.validators.len() >= self.network_state.consensus_params.max_validators as usize {
            return Err(anyhow::anyhow!("Maximum validators reached"));
        }
        
        self.network_state.validators.insert(validator.address.clone(), validator);
        Ok(())
    }
    
    /// Remove validator from network
    pub fn remove_validator(&mut self, address: &str) -> Result<()> {
        self.network_state.validators.remove(address);
        Ok(())
    }
    
    /// Update validator voting power
    pub fn update_voting_power(&mut self, address: &str, new_power: u64) -> Result<()> {
        if let Some(validator) = self.network_state.validators.get_mut(address) {
            validator.voting_power = new_power;
        }
        Ok(())
    }
    
    /// Get network state
    pub fn get_network_state(&self) -> &PQCNetworkState {
        &self.network_state
    }
    
    /// Increment block height
    pub fn increment_height(&mut self) {
        self.network_state.current_height += 1;
    }
    
    /// Validate consensus parameters
    pub fn validate_consensus_params(&self) -> Result<()> {
        if self.network_state.consensus_params.block_time_ms < 100 {
            return Err(anyhow::anyhow!("Block time too fast"));
        }
        
        if self.network_state.consensus_params.min_stake == 0 {
            return Err(anyhow::anyhow!("Minimum stake cannot be zero"));
        }
        
        Ok(())
    }
}

/// PQC Signature Verification Service
pub struct PQCSignatureService {
    validators: HashMap<String, QuantumKeyBundle>,
}

impl PQCSignatureService {
    /// Create new signature service
    pub fn new() -> Self {
        Self {
            validators: HashMap::new(),
        }
    }
    
    /// Register validator keys
    pub fn register_validator(&mut self, address: String, keys: QuantumKeyBundle) {
        self.validators.insert(address, keys);
    }
    
    /// Verify signature from specific validator
    pub fn verify_signature(
        &self,
        message: &[u8],
        signature: &[u8],
        validator_address: &str,
    ) -> Result<bool> {
        if let Some(keys) = self.validators.get(validator_address) {
            keys.verify_dilithium(message, signature)
        } else {
            Ok(false)
        }
    }
    
    /// Batch verify multiple signatures
    pub fn batch_verify_signatures(
        &self,
        messages: &[&[u8]],
        signatures: &[&[u8]],
        validator_addresses: &[&str],
    ) -> Result<Vec<bool>> {
        let mut results = Vec::new();
        
        for i in 0..messages.len() {
            if i < signatures.len() && i < validator_addresses.len() {
                let result = self.verify_signature(
                    messages[i],
                    signatures[i],
                    validator_addresses[i],
                )?;
                results.push(result);
            }
        }
        
        Ok(results)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pqc_validator_manager() {
        let manager = PQCValidatorManager::new(
            "test-validator".to_string(),
            "qsn1test...".to_string(),
        ).unwrap();
        
        assert_eq!(manager.config.name, "test-validator");
        assert_eq!(manager.config.voting_power, 1000000);
    }
    
    #[test]
    fn test_signature_service() {
        let mut service = PQCSignatureService::new();
        let keys = QuantumKeyBundle::generate().unwrap();
        
        service.register_validator("qsn1test...".to_string(), keys.clone());
        
        let message = b"test message";
        let signature = keys.sign_dilithium(message).unwrap();
        
        let is_valid = service.verify_signature(
            message,
            &signature,
            "qsn1test...",
        ).unwrap();
        
        assert!(is_valid);
    }
}
