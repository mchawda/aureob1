package evm

import (
	"bytes"
	"crypto/sha3"
	"encoding/binary"
	"errors"
	"fmt"
	"log"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/vm"

	// Import Dilithium & Kyber from QSmart (path adjusted)
	// "github.com/mchawda/qsmart/pqcrypto/dilithium"
	// "github.com/mchawda/qsmart/pqcrypto/kyber"
)

// PQPrecompiles registers post-quantum cryptographic precompiles for the EVM
type PQPrecompiles struct {
	pqVerify   *PqVerifyPrecompile
	kyberEnc   *KyberEncPrecompile
	kyberDec   *KyberDecPrecompile
}

// NewPQPrecompiles creates new PQ precompile instances
func NewPQPrecompiles() *PQPrecompiles {
	return &PQPrecompiles{
		pqVerify: &PqVerifyPrecompile{},
		kyberEnc: &KyberEncPrecompile{},
		kyberDec: &KyberDecPrecompile{},
	}
}

// ─────────────────────────────────────────────────────────────────────────
// PqVerify Precompile (0x0101)
// ─────────────────────────────────────────────────────────────────────────

// PqVerifyPrecompile implements Dilithium2 signature verification
// Address: 0x0000000000000000000000000000000000000101
// Input:  [pubkey_len(32)][pubkey][msg_len(32)][msg][sig_len(32)][sig]
// Output: [verified(32)] where verified = 1 for true, 0 for false
type PqVerifyPrecompile struct{}

// Address returns the address where the precompile is accessible
func (p *PqVerifyPrecompile) Address() common.Address {
	return common.HexToAddress("0x0000000000000000000000000000000000000101")
}

// RequiredGas calculates the gas cost
// Base: 3000 gas + 6 gas per byte of data
func (p *PqVerifyPrecompile) RequiredGas(input []byte) uint64 {
	baseGas := uint64(3000)
	perByteGas := uint64(6)
	return baseGas + (uint64(len(input)) * perByteGas)
}

// Run executes the PQ signature verification
func (p *PqVerifyPrecompile) Run(input []byte) ([]byte, error) {
	// Parse input: [pubkey_len:32][pubkey][msg_len:32][msg][sig_len:32][sig]
	if len(input) < 96 {
		return nil, errors.New("invalid input length")
	}

	// Read public key length (first 32 bytes as big-endian uint256)
	pubKeyLen := binary.BigEndian.Uint32(input[28:32])
	offset := uint32(32)

	if uint32(len(input)) < offset+pubKeyLen {
		return nil, errors.New("invalid public key length")
	}

	pubKey := input[offset : offset+pubKeyLen]
	offset += pubKeyLen

	// Read message length
	if uint32(len(input)) < offset+32 {
		return nil, errors.New("message length field out of bounds")
	}

	msgLen := binary.BigEndian.Uint32(input[offset+28 : offset+32])
	offset += 32

	if uint32(len(input)) < offset+msgLen {
		return nil, errors.New("message data out of bounds")
	}

	msg := input[offset : offset+msgLen]
	offset += msgLen

	// Read signature length
	if uint32(len(input)) < offset+32 {
		return nil, errors.New("signature length field out of bounds")
	}

	sigLen := binary.BigEndian.Uint32(input[offset+28 : offset+32])
	offset += 32

	if uint32(len(input)) < offset+sigLen {
		return nil, errors.New("signature data out of bounds")
	}

	sig := input[offset : offset+sigLen]

	// Verify the signature
	// TODO: Replace with actual Dilithium2 verification from QSmart
	// verified := dilithium.Verify(pubKey, msg, sig)

	log.Printf("[PqVerify] Verifying signature (pubkey: %d bytes, msg: %d bytes, sig: %d bytes)\n",
		len(pubKey), len(msg), len(sig))

	// Placeholder: perform basic validation
	verified := p.verifySignaturePlaceholder(pubKey, msg, sig)

	// Return result as 32-byte big-endian uint256
	result := make([]byte, 32)
	if verified {
		result[31] = 1
	}

	log.Printf("[PqVerify] Result: %v\n", verified)
	return result, nil
}

// verifySignaturePlaceholder is a mock verification for demonstration
func (p *PqVerifyPrecompile) verifySignaturePlaceholder(pubKey, msg, sig []byte) bool {
	// Placeholder logic for demo purposes
	// In production: use actual Dilithium2 verification
	if len(pubKey) == 0 || len(msg) == 0 || len(sig) == 0 {
		return false
	}

	// Mock: accept if signature is at least 100 bytes (realistic size)
	return len(sig) >= 100 && len(pubKey) >= 1000
}

// ─────────────────────────────────────────────────────────────────────────
// KyberEnc Precompile (0x0102)
// ─────────────────────────────────────────────────────────────────────────

// KyberEncPrecompile implements Kyber768 encapsulation
// Address: 0x0000000000000000000000000000000000000102
// Input:  [pubkey_len(32)][pubkey]
// Output: [ciphertext_len(32)][ciphertext][shared_secret_len(32)][shared_secret]
type KyberEncPrecompile struct{}

// Address returns the precompile address
func (k *KyberEncPrecompile) Address() common.Address {
	return common.HexToAddress("0x0000000000000000000000000000000000000102")
}

// RequiredGas calculates the gas cost
// Base: 4000 gas + 10 gas per byte
func (k *KyberEncPrecompile) RequiredGas(input []byte) uint64 {
	baseGas := uint64(4000)
	perByteGas := uint64(10)
	return baseGas + (uint64(len(input)) * perByteGas)
}

// Run executes Kyber768 encapsulation
func (k *KyberEncPrecompile) Run(input []byte) ([]byte, error) {
	if len(input) < 32 {
		return nil, errors.New("invalid input length")
	}

	// Read public key length
	pubKeyLen := binary.BigEndian.Uint32(input[28:32])
	offset := uint32(32)

	if uint32(len(input)) < offset+pubKeyLen {
		return nil, errors.New("invalid public key length")
	}

	pubKey := input[offset : offset+pubKeyLen]

	// Perform encapsulation
	// TODO: Replace with actual Kyber768 encapsulation from QSmart
	// ciphertext, sharedSecret, err := kyber.Encapsulate768(pubKey)

	ciphertext, sharedSecret := k.encapsulatePlaceholder(pubKey)

	// Build output: [ct_len:32][ciphertext][ss_len:32][shared_secret]
	result := make([]byte, 32+len(ciphertext)+32+len(sharedSecret))

	// Ciphertext length as big-endian uint256
	binary.BigEndian.PutUint32(result[28:32], uint32(len(ciphertext)))
	copy(result[32:32+len(ciphertext)], ciphertext)

	// Shared secret length as big-endian uint256
	offset = 32 + uint32(len(ciphertext))
	binary.BigEndian.PutUint32(result[offset+28:offset+32], uint32(len(sharedSecret)))
	copy(result[offset+32:], sharedSecret)

	log.Printf("[KyberEnc] Generated ciphertext: %d bytes, shared secret: %d bytes\n",
		len(ciphertext), len(sharedSecret))

	return result, nil
}

// encapsulatePlaceholder generates mock Kyber768 ciphertext and shared secret
func (k *KyberEncPrecompile) encapsulatePlaceholder(pubKey []byte) ([]byte, []byte) {
	// Kyber768: ciphertext ~1088 bytes, shared secret 32 bytes
	ciphertext := make([]byte, 1088)
	sharedSecret := make([]byte, 32)

	// Deterministic generation based on pubkey hash for reproducibility
	hash := sha3.NewLegacyKeccak256()
	hash.Write(pubKey)
	seed := hash.Sum(nil)

	for i := 0; i < len(ciphertext); i++ {
		ciphertext[i] = seed[(i+1)%32]
	}
	for i := 0; i < len(sharedSecret); i++ {
		sharedSecret[i] = seed[i]
	}

	return ciphertext, sharedSecret
}

// ─────────────────────────────────────────────────────────────────────────
// KyberDec Precompile (0x0103)
// ─────────────────────────────────────────────────────────────────────────

// KyberDecPrecompile implements Kyber768 decapsulation
// Address: 0x0000000000000000000000000000000000000103
// Input:  [privkey_len(32)][privkey][ciphertext_len(32)][ciphertext]
// Output: [shared_secret_len(32)][shared_secret]
type KyberDecPrecompile struct{}

// Address returns the precompile address
func (k *KyberDecPrecompile) Address() common.Address {
	return common.HexToAddress("0x0000000000000000000000000000000000000103")
}

// RequiredGas calculates the gas cost
// Base: 5000 gas + 12 gas per byte
func (k *KyberDecPrecompile) RequiredGas(input []byte) uint64 {
	baseGas := uint64(5000)
	perByteGas := uint64(12)
	return baseGas + (uint64(len(input)) * perByteGas)
}

// Run executes Kyber768 decapsulation
func (k *KyberDecPrecompile) Run(input []byte) ([]byte, error) {
	if len(input) < 64 {
		return nil, errors.New("invalid input length")
	}

	// Read private key length
	privKeyLen := binary.BigEndian.Uint32(input[28:32])
	offset := uint32(32)

	if uint32(len(input)) < offset+privKeyLen {
		return nil, errors.New("invalid private key length")
	}

	privKey := input[offset : offset+privKeyLen]
	offset += privKeyLen

	// Read ciphertext length
	if uint32(len(input)) < offset+32 {
		return nil, errors.New("ciphertext length field out of bounds")
	}

	ctLen := binary.BigEndian.Uint32(input[offset+28 : offset+32])
	offset += 32

	if uint32(len(input)) < offset+ctLen {
		return nil, errors.New("ciphertext data out of bounds")
	}

	ciphertext := input[offset : offset+ctLen]

	// Perform decapsulation
	// TODO: Replace with actual Kyber768 decapsulation from QSmart
	// sharedSecret, err := kyber.Decapsulate768(privKey, ciphertext)

	sharedSecret := k.decapsulatePlaceholder(privKey, ciphertext)

	// Build output: [ss_len:32][shared_secret]
	result := make([]byte, 32+len(sharedSecret))
	binary.BigEndian.PutUint32(result[28:32], uint32(len(sharedSecret)))
	copy(result[32:], sharedSecret)

	log.Printf("[KyberDec] Recovered shared secret: %d bytes\n", len(sharedSecret))

	return result, nil
}

// decapsulatePlaceholder recovers the shared secret from ciphertext
func (k *KyberDecPrecompile) decapsulatePlaceholder(privKey, ciphertext []byte) []byte {
	// Kyber768 shared secret is 32 bytes
	sharedSecret := make([]byte, 32)

	// Deterministic recovery based on privkey hash
	hash := sha3.NewLegacyKeccak256()
	hash.Write(privKey)
	hash.Write(ciphertext)
	result := hash.Sum(nil)

	copy(sharedSecret, result)

	return sharedSecret
}

// ─────────────────────────────────────────────────────────────────────────
// Precompile Registration
// ─────────────────────────────────────────────────────────────────────────

// PrecompileRegistry holds all registered PQ precompiles
type PrecompileRegistry struct {
	precompiles map[common.Address]vm.PrecompiledContract
}

// NewPrecompileRegistry creates a new registry
func NewPrecompileRegistry() *PrecompileRegistry {
	registry := &PrecompileRegistry{
		precompiles: make(map[common.Address]vm.PrecompiledContract),
	}

	// Register PQ precompiles
	pqVerify := &PqVerifyPrecompile{}
	kyberEnc := &KyberEncPrecompile{}
	kyberDec := &KyberDecPrecompile{}

	registry.precompiles[pqVerify.Address()] = pqVerify
	registry.precompiles[kyberEnc.Address()] = kyberEnc
	registry.precompiles[kyberDec.Address()] = kyberDec

	log.Printf("[Precompiles] Registered 3 PQ precompiles:\n")
	log.Printf("  0x0101: PqVerify (Dilithium2 verification)\n")
	log.Printf("  0x0102: KyberEnc (Kyber768 encapsulation)\n")
	log.Printf("  0x0103: KyberDec (Kyber768 decapsulation)\n")

	return registry
}

// GetPrecompile returns a precompile by address
func (pr *PrecompileRegistry) GetPrecompile(addr common.Address) vm.PrecompiledContract {
	return pr.precompiles[addr]
}

// IsPrecompile checks if an address is a precompile
func (pr *PrecompileRegistry) IsPrecompile(addr common.Address) bool {
	_, exists := pr.precompiles[addr]
	return exists
}

// GetAllPrecompiles returns all registered precompiles
func (pr *PrecompileRegistry) GetAllPrecompiles() map[common.Address]vm.PrecompiledContract {
	return pr.precompiles
}

// ─────────────────────────────────────────────────────────────────────────
// Solidity Library Helper
// ─────────────────────────────────────────────────────────────────────────

// PQLibSolidity provides the Solidity library code for PQ operations
const PQLibSolidity = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * PQ Library - Post-Quantum Cryptographic Operations
 * 
 * Provides Solidity interface to PQ precompiles:
 * - 0x0101: Dilithium2 signature verification
 * - 0x0102: Kyber768 encapsulation
 * - 0x0103: Kyber768 decapsulation
 */
library PQ {
    // PQ precompile addresses
    address constant PQ_VERIFY_ADDR   = 0x0000000000000000000000000000000000000101;
    address constant KYBER_ENC_ADDR   = 0x0000000000000000000000000000000000000102;
    address constant KYBER_DEC_ADDR   = 0x0000000000000000000000000000000000000103;

    /**
     * Verify a Dilithium2 signature
     * @param pubKey The public key (bytes)
     * @param msgHash The message hash (bytes32)
     * @param signature The signature (bytes)
     * @return valid True if signature is valid
     */
    function verify(
        bytes memory pubKey,
        bytes32 msgHash,
        bytes memory signature
    ) internal view returns (bool valid) {
        bytes memory msg = abi.encodePacked(msgHash);
        
        // Construct input for PqVerify precompile
        bytes memory input = abi.encodePacked(
            uint256(pubKey.length),
            pubKey,
            uint256(msg.length),
            msg,
            uint256(signature.length),
            signature
        );
        
        bytes memory output;
        assembly {
            // Call PqVerify precompile at 0x0101
            let success := staticcall(
                gas(),
                PQ_VERIFY_ADDR,
                add(input, 0x20),
                mload(input),
                0x00,
                0x20
            )
            
            if iszero(success) {
                revert(0, 0)
            }
            
            // Load result from return data
            let result := mload(0x00)
            valid := eq(result, 1)
        }
    }

    /**
     * Encapsulate with Kyber768
     * @param pubKey The Kyber public key (bytes)
     * @return ciphertext The encapsulated ciphertext
     * @return sharedSecret The derived shared secret
     */
    function encapsulate(bytes memory pubKey)
        internal
        view
        returns (bytes memory ciphertext, bytes memory sharedSecret)
    {
        bytes memory input = abi.encodePacked(
            uint256(pubKey.length),
            pubKey
        );
        
        bytes memory output;
        assembly {
            // Call KyberEnc precompile at 0x0102
            let success := staticcall(
                gas(),
                KYBER_ENC_ADDR,
                add(input, 0x20),
                mload(input),
                0x00,
                0x2000  // 8KB buffer for output
            )
            
            if iszero(success) {
                revert(0, 0)
            }
            
            // Parse output [ct_len:32][ciphertext][ss_len:32][shared_secret]
            let ct_len := mload(0x1c)
            let ct_offset := 0x20
            
            ciphertext := mload(0x40)
            mstore(ciphertext, ct_len)
            mstore(0x40, add(ciphertext, add(0x20, ct_len)))
            
            let ss_offset := add(ct_offset, ct_len)
            let ss_len := mload(add(ss_offset, 0x1c))
            
            sharedSecret := mload(0x40)
            mstore(sharedSecret, ss_len)
            mstore(0x40, add(sharedSecret, add(0x20, ss_len)))
        }
    }

    /**
     * Decapsulate with Kyber768
     * @param privKey The Kyber private key (bytes)
     * @param ciphertext The encapsulated ciphertext (bytes)
     * @return sharedSecret The recovered shared secret
     */
    function decapsulate(bytes memory privKey, bytes memory ciphertext)
        internal
        view
        returns (bytes memory sharedSecret)
    {
        bytes memory input = abi.encodePacked(
            uint256(privKey.length),
            privKey,
            uint256(ciphertext.length),
            ciphertext
        );
        
        assembly {
            // Call KyberDec precompile at 0x0103
            let success := staticcall(
                gas(),
                KYBER_DEC_ADDR,
                add(input, 0x20),
                mload(input),
                0x00,
                0x100  // 256 bytes buffer for output
            )
            
            if iszero(success) {
                revert(0, 0)
            }
            
            // Parse output [ss_len:32][shared_secret]
            let ss_len := mload(0x1c)
            
            sharedSecret := mload(0x40)
            mstore(sharedSecret, ss_len)
            mstore(0x40, add(sharedSecret, add(0x20, ss_len)))
        }
    }
}
`

// GetSolidityLibrary returns the Solidity library code
func GetSolidityLibrary() string {
	return PQLibSolidity
}
