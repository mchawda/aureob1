package consensus

import (
	"crypto/sha3"
	"errors"
	"fmt"
	"log"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/rlp"

	// Import Dilithium from QSmart (path adjusted based on actual module layout)
	// "github.com/mchawda/qsmart/pqcrypto/dilithium"
)

// PQSigner handles post-quantum cryptographic signing operations
type PQSigner struct {
	algorithm   string // "dilithium2", "dilithium3", etc.
	privateKey  []byte // PQ private key
	publicKey   []byte // PQ public key
	address     common.Address // Derived address from PQ public key
}

// NewPQSigner creates a new PQ signer instance
func NewPQSigner(algo string, privKey []byte, pubKey []byte) (*PQSigner, error) {
	if algo != "dilithium2" && algo != "dilithium3" {
		return nil, fmt.Errorf("unsupported PQ algorithm: %s", algo)
	}

	if len(privKey) == 0 || len(pubKey) == 0 {
		return nil, errors.New("private key and public key cannot be empty")
	}

	// Derive address from PQ public key using Keccak256
	// address = last 20 bytes of keccak256(pubKey)
	hash := sha3.NewLegacyKeccak256()
	hash.Write(pubKey)
	hashBytes := hash.Sum(nil)
	address := common.BytesToAddress(hashBytes[12:32]) // Take last 20 bytes

	return &PQSigner{
		algorithm:  algo,
		privateKey: privKey,
		publicKey:  pubKey,
		address:    address,
	}, nil
}

// GetAddress returns the derived address
func (ps *PQSigner) GetAddress() common.Address {
	return ps.address
}

// GetPublicKey returns the public key
func (ps *PQSigner) GetPublicKey() []byte {
	return ps.publicKey
}

// HashHeaderSansSig creates a hash of the block header without PQ signature fields
// This is the data that will be signed with Dilithium2
func HashHeaderSansSig(header interface{}) ([]byte, error) {
	// Create a copy of header without PQ fields
	// In actual implementation, this would work with the proto-generated struct
	
	// For now, we demonstrate the concept:
	// Encode header without pq_sig, pq_agg_sig fields
	headerBytes, err := rlp.EncodeToBytes(header)
	if err != nil {
		return nil, fmt.Errorf("failed to encode header: %w", err)
	}

	// Compute Keccak256 hash
	hash := sha3.NewLegacyKeccak256()
	hash.Write(headerBytes)
	return hash.Sum(nil), nil
}

// ProposerSignHeader signs a block header with Dilithium2
// This is called by the proposer to create the pq_sig field
func (ps *PQSigner) ProposerSignHeader(headerHash []byte) ([]byte, error) {
	if ps.algorithm != "dilithium2" && ps.algorithm != "dilithium3" {
		return nil, fmt.Errorf("unsupported algorithm for signing: %s", ps.algorithm)
	}

	// In production: dilithium.Sign(ps.privateKey, headerHash)
	// For now, we log the operation (actual signing will be done via QSmart library)
	log.Printf("[PQ] Signing header with %s, hash: %x\n", ps.algorithm, headerHash[:8])

	// TODO: Replace with actual Dilithium2 signing from QSmart
	// sig := dilithium.Sign(ps.privateKey, headerHash)

	// Placeholder: return mock signature (in practice, use QSmart library)
	// Dilithium2 signatures are typically ~2.7-3.0 KB
	mockSig := make([]byte, 2800) // Mock ~2.8KB signature
	copy(mockSig, []byte("DILITHIUM2_SIG_PLACEHOLDER_"))
	return mockSig, nil
}

// VerifyPQSignature verifies a PQ signature using Dilithium2
// This is called by validators to verify the proposer's signature
func (ps *PQSigner) VerifyPQSignature(pubKey []byte, headerHash []byte, signature []byte) bool {
	if len(pubKey) == 0 || len(signature) == 0 {
		log.Println("[PQ] Verification failed: empty public key or signature")
		return false
	}

	// In production: dilithium.Verify(pubKey, headerHash, signature)
	log.Printf("[PQ] Verifying %s signature, pubkey len: %d, sig len: %d\n", 
		ps.algorithm, len(pubKey), len(signature))

	// TODO: Replace with actual Dilithium2 verification from QSmart
	// return dilithium.Verify(pubKey, headerHash, signature)

	// Placeholder: accept mock signatures for now
	return len(signature) > 0 && len(pubKey) > 0
}

// VoteDigest creates a hash of a consensus vote for signing
// This is used for both proposal votes and commit votes
func VoteDigest(round uint64, height uint64, blockID string) []byte {
	// Encode vote components
	voteData := struct {
		Round   uint64
		Height  uint64
		BlockID string
	}{round, height, blockID}

	data, err := rlp.EncodeToBytes(voteData)
	if err != nil {
		log.Printf("Failed to encode vote: %v\n", err)
		return nil
	}

	// Hash the vote data
	hash := sha3.NewLegacyKeccak256()
	hash.Write(data)
	return hash.Sum(nil)
}

// SignVote signs a consensus vote with Dilithium2
// Used in BFT consensus to sign votes/commits
func (ps *PQSigner) SignVote(round uint64, height uint64, blockID string) ([]byte, error) {
	voteHash := VoteDigest(round, height, blockID)
	if voteHash == nil {
		return nil, errors.New("failed to create vote digest")
	}

	// TODO: Replace with actual Dilithium2 signing
	log.Printf("[PQ] Signing vote for round %d, height %d\n", round, height)

	// Placeholder signature
	mockSig := make([]byte, 2800)
	copy(mockSig, []byte("DILITHIUM2_VOTE_"))
	return mockSig, nil
}

// VerifyVote verifies a consensus vote signature
func VerifyVote(pubKey []byte, round uint64, height uint64, blockID string, signature []byte) bool {
	voteHash := VoteDigest(round, height, blockID)
	if voteHash == nil {
		return false
	}

	// TODO: Replace with actual Dilithium2 verification
	log.Printf("[PQ] Verifying vote signature, sig len: %d\n", len(signature))
	return len(signature) > 0 && len(pubKey) > 0
}

// ValidatorRegistry tracks validator PQ keys and enables key rotation
type ValidatorRegistry struct {
	validators map[string]*ValidatorInfo
}

// ValidatorInfo stores information about a validator
type ValidatorInfo struct {
	Address     common.Address
	PQPublicKey []byte
	Algorithm   string
	Power       uint64
	Active      bool
	EpochAdded  uint64
	EpochExpired uint64
}

// NewValidatorRegistry creates a new validator registry
func NewValidatorRegistry() *ValidatorRegistry {
	return &ValidatorRegistry{
		validators: make(map[string]*ValidatorInfo),
	}
}

// AddValidator adds a new validator to the registry
func (vr *ValidatorRegistry) AddValidator(addr common.Address, pubKey []byte, algo string, power uint64, epoch uint64) error {
	if len(pubKey) == 0 {
		return errors.New("public key cannot be empty")
	}

	key := addr.Hex()
	vr.validators[key] = &ValidatorInfo{
		Address:     addr,
		PQPublicKey: pubKey,
		Algorithm:   algo,
		Power:       power,
		Active:      true,
		EpochAdded:  epoch,
		EpochExpired: 0,
	}

	log.Printf("[ValidatorRegistry] Added validator %s with %s key (power: %d)\n", addr.Hex(), algo, power)
	return nil
}

// RotateValidatorKey rotates a validator's PQ key to a new one (epoch-based)
func (vr *ValidatorRegistry) RotateValidatorKey(addr common.Address, newPubKey []byte, newAlgo string, epoch uint64) error {
	key := addr.Hex()
	validator, exists := vr.validators[key]
	if !exists {
		return fmt.Errorf("validator %s not found", addr.Hex())
	}

	// Mark old key as expired
	validator.EpochExpired = epoch

	// Add new validator entry with rotated key
	vr.validators[key+"_new"] = &ValidatorInfo{
		Address:     addr,
		PQPublicKey: newPubKey,
		Algorithm:   newAlgo,
		Power:       validator.Power,
		Active:      true,
		EpochAdded:  epoch,
		EpochExpired: 0,
	}

	log.Printf("[ValidatorRegistry] Rotated key for validator %s at epoch %d\n", addr.Hex(), epoch)
	return nil
}

// GetActiveValidator retrieves active validator info
func (vr *ValidatorRegistry) GetActiveValidator(addr common.Address) (*ValidatorInfo, error) {
	key := addr.Hex()
	if validator, exists := vr.validators[key]; exists && validator.Active && validator.EpochExpired == 0 {
		return validator, nil
	}

	// Try to find most recent validator key
	if validator, exists := vr.validators[key+"_new"]; exists && validator.Active {
		return validator, nil
	}

	return nil, fmt.Errorf("no active validator found for %s", addr.Hex())
}

// GetAllActiveValidators returns all currently active validators
func (vr *ValidatorRegistry) GetAllActiveValidators() []*ValidatorInfo {
	var active []*ValidatorInfo
	for _, v := range vr.validators {
		if v.Active && v.EpochExpired == 0 {
			active = append(active, v)
		}
	}
	return active
}
