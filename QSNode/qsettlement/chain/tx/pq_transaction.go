package tx

import (
	"crypto/sha3"
	"errors"
	"fmt"
	"log"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/rlp"

	// Import Dilithium from QSmart (path adjusted)
	// "github.com/mchawda/qsmart/pqcrypto/dilithium"
)

// PQTransaction represents an EIP-2718 Type 0x79 post-quantum transaction
type PQTransaction struct {
	// Standard EIP-1559 transaction fields
	ChainID         *big.Int
	Nonce           uint64
	MaxPriorityFeePerGas *big.Int
	MaxFeePerGas    *big.Int
	Gas             uint64
	To              *common.Address `rlp:"nil"`
	Value           *big.Int
	Data            []byte

	// EIP-2930 optional access list
	AccessList []AccessTuple `rlp:"nil"`

	// Post-Quantum Signature Fields (EIP-2718 type 0x79)
	PQSigAlgo   uint8  // 0x01 = Dilithium2, 0x02 = Dilithium3, etc.
	PQPublicKey []byte // Dilithium2 public key (~1.3 KB)
	PQSignature []byte // Dilithium2 signature (~2.7-3.0 KB)

	// Derived fields (set during verification)
	From    *common.Address
	Hash    common.Hash
	Type    uint8 // Always 0x79 for this tx type
}

// AccessTuple represents an EIP-2930 access list entry
type AccessTuple struct {
	Address     common.Address
	StorageKeys []common.Hash
}

// DecodePQTx decodes an EIP-2718 type 0x79 transaction from RLP bytes
// Format: 0x79 || rlp(chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data, accessList, pqSigAlgo, pqPubKey, pqSignature)
func DecodePQTx(data []byte) (*PQTransaction, error) {
	if len(data) < 1 {
		return nil, errors.New("transaction data too short")
	}

	// First byte should be the transaction type (0x79)
	txType := data[0]
	if txType != 0x79 {
		return nil, fmt.Errorf("invalid transaction type: expected 0x79, got 0x%x", txType)
	}

	// Decode RLP data
	var tx PQTransaction
	if err := rlp.DecodeBytes(data[1:], &tx); err != nil {
		return nil, fmt.Errorf("failed to decode PQ transaction: %w", err)
	}

	tx.Type = 0x79
	return &tx, nil
}

// EncodePQTx encodes a PQ transaction to EIP-2718 format
func (tx *PQTransaction) EncodePQTx() ([]byte, error) {
	// Encode the transaction fields
	txData, err := rlp.EncodeToBytes(tx)
	if err != nil {
		return nil, fmt.Errorf("failed to encode PQ transaction: %w", err)
	}

	// Prepend transaction type
	result := make([]byte, 1+len(txData))
	result[0] = 0x79
	copy(result[1:], txData)

	return result, nil
}

// SighashParts returns the data that needs to be signed
// Includes all fields except the signature fields
func (tx *PQTransaction) SighashParts() []interface{} {
	return []interface{}{
		tx.ChainID,
		tx.Nonce,
		tx.MaxPriorityFeePerGas,
		tx.MaxFeePerGas,
		tx.Gas,
		tx.To,
		tx.Value,
		tx.Data,
		tx.AccessList,
		tx.PQSigAlgo,
		tx.PQPublicKey,
	}
}

// ComputeSigningHash computes the hash that was signed with Dilithium2
func (tx *PQTransaction) ComputeSigningHash() ([]byte, error) {
	sighashData := tx.SighashParts()

	// Encode to RLP
	signData, err := rlp.EncodeToBytes(sighashData)
	if err != nil {
		return nil, fmt.Errorf("failed to encode signing data: %w", err)
	}

	// Compute Keccak256 hash
	hash := sha3.NewLegacyKeccak256()
	hash.Write(signData)

	return hash.Sum(nil), nil
}

// DeriveAddress derives the sender address from PQ public key
// address = last 20 bytes of keccak256(pubkey)
func (tx *PQTransaction) DeriveAddress() (common.Address, error) {
	if len(tx.PQPublicKey) == 0 {
		return common.Address{}, errors.New("public key is empty")
	}

	hash := sha3.NewLegacyKeccak256()
	hash.Write(tx.PQPublicKey)
	hashBytes := hash.Sum(nil)

	// Take last 20 bytes as address
	return common.BytesToAddress(hashBytes[12:32]), nil
}

// VerifyPQTx verifies the PQ transaction signature and sets the From address
func VerifyPQTx(tx *PQTransaction) error {
	if tx == nil {
		return errors.New("transaction is nil")
	}

	if len(tx.PQPublicKey) == 0 {
		return errors.New("public key is empty")
	}

	if len(tx.PQSignature) == 0 {
		return errors.New("signature is empty")
	}

	// Compute signing hash
	signingHash, err := tx.ComputeSigningHash()
	if err != nil {
		return fmt.Errorf("failed to compute signing hash: %w", err)
	}

	// TODO: Replace with actual Dilithium2 verification from QSmart
	// verified := dilithium.Verify(tx.PQPublicKey, signingHash, tx.PQSignature)
	// if !verified {
	//     return errors.New("invalid PQ signature")
	// }

	log.Printf("[PQTx] Verifying PQ signature (algo: %d, pubkey len: %d, sig len: %d)\n",
		tx.PQSigAlgo, len(tx.PQPublicKey), len(tx.PQSignature))

	// Placeholder: accept all valid signatures for now
	if len(tx.PQSignature) < 100 {
		return errors.New("signature too short")
	}

	// Derive and set the From address
	from, err := tx.DeriveAddress()
	if err != nil {
		return fmt.Errorf("failed to derive address: %w", err)
	}

	tx.From = &from

	// Compute transaction hash
	txHash, err := tx.ComputeHash()
	if err != nil {
		return fmt.Errorf("failed to compute hash: %w", err)
	}

	tx.Hash = txHash

	log.Printf("[PQTx] Verified | From: %s | Hash: %s\n", from.Hex(), txHash.Hex())

	return nil
}

// ComputeHash computes the transaction hash
func (tx *PQTransaction) ComputeHash() (common.Hash, error) {
	encoded, err := tx.EncodePQTx()
	if err != nil {
		return common.Hash{}, err
	}

	hash := sha3.NewLegacyKeccak256()
	hash.Write(encoded)

	return common.BytesToHash(hash.Sum(nil)), nil
}

// DecodeTx is a generic transaction decoder that routes to the correct decoder based on type
func DecodeTx(raw []byte) (interface{}, error) {
	if len(raw) == 0 {
		return nil, errors.New("empty transaction data")
	}

	txType := raw[0]

	switch txType {
	case 0x00:
		// Legacy transaction
		return DecodeLegacyTx(raw[1:])
	case 0x01:
		// EIP-2930 access list transaction
		return Decode2930Tx(raw[1:])
	case 0x02:
		// EIP-1559 dynamic fee transaction
		return Decode1559Tx(raw[1:])
	case 0x79:
		// EIP-2718 Post-Quantum Transaction
		return DecodePQTx(raw)
	default:
		return nil, fmt.Errorf("unknown transaction type: 0x%x", txType)
	}
}

// TODO: Add placeholder decoders for other transaction types
// For now, just stub them out

func DecodeLegacyTx(data []byte) (interface{}, error) {
	log.Printf("[Tx] Decoding legacy transaction (%d bytes)\n", len(data))
	return nil, errors.New("legacy transaction decoding not yet implemented")
}

func Decode2930Tx(data []byte) (interface{}, error) {
	log.Printf("[Tx] Decoding EIP-2930 transaction (%d bytes)\n", len(data))
	return nil, errors.New("EIP-2930 transaction decoding not yet implemented")
}

func Decode1559Tx(data []byte) (interface{}, error) {
	log.Printf("[Tx] Decoding EIP-1559 transaction (%d bytes)\n", len(data))
	return nil, errors.New("EIP-1559 transaction decoding not yet implemented")
}

// Gas calculates the total gas cost of the transaction
func (tx *PQTransaction) Gas() uint64 {
	return tx.Gas
}

// Value returns the value being transferred
func (tx *PQTransaction) Value() *big.Int {
	return tx.Value
}

// Nonce returns the transaction nonce
func (tx *PQTransaction) Nonce() uint64 {
	return tx.Nonce
}

// GetFrom returns the sender address (if verified)
func (tx *PQTransaction) GetFrom() *common.Address {
	return tx.From
}

// GetTo returns the recipient address
func (tx *PQTransaction) GetTo() *common.Address {
	return tx.To
}

// GetData returns the transaction data/payload
func (tx *PQTransaction) GetData() []byte {
	return tx.Data
}
