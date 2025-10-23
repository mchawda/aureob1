package p2p

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"time"

	// Import Kyber from QSmart (path adjusted based on actual module layout)
	// "github.com/mchawda/qsmart/pqcrypto/kyber"
)

// KyberKEM handles post-quantum key encapsulation mechanism
type KyberKEM struct {
	algorithm string // "kyber512", "kyber768", "kyber1024"
	privateKey []byte // KEM private key
	publicKey  []byte // KEM public key
}

// NewKyberKEM creates a new Kyber KEM instance
func NewKyberKEM(algo string, privKey []byte, pubKey []byte) (*KyberKEM, error) {
	if algo != "kyber512" && algo != "kyber768" && algo != "kyber1024" {
		return nil, fmt.Errorf("unsupported Kyber algorithm: %s", algo)
	}

	if len(privKey) == 0 || len(pubKey) == 0 {
		return nil, errors.New("private key and public key cannot be empty")
	}

	return &KyberKEM{
		algorithm:  algo,
		privateKey: privKey,
		publicKey:  pubKey,
	}, nil
}

// GenerateKeyPair generates a new Kyber KEM keypair
// In production, this uses actual Kyber implementation from QSmart
func GenerateKeyPair(algo string) (pubKey []byte, privKey []byte, err error) {
	if algo != "kyber512" && algo != "kyber768" && algo != "kyber1024" {
		return nil, nil, fmt.Errorf("unsupported algorithm: %s", algo)
	}

	// TODO: Replace with actual Kyber key generation from QSmart
	// pubKey, privKey, err := kyber.GenerateKeyPair768()

	// Placeholder: generate mock keys
	pubKey = make([]byte, 1184)  // Kyber768 public key is ~1184 bytes
	privKey = make([]byte, 2400) // Kyber768 private key is ~2400 bytes

	_, err = rand.Read(pubKey)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate public key: %w", err)
	}

	_, err = rand.Read(privKey)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate private key: %w", err)
	}

	return pubKey, privKey, nil
}

// Encapsulate creates a shared secret using peer's public key
// Returns: (ciphertext, shared_secret, error)
// In production, this uses actual Kyber encapsulation
func (k *KyberKEM) Encapsulate(peerPublicKey []byte) (ciphertext []byte, sharedSecret []byte, err error) {
	if len(peerPublicKey) == 0 {
		return nil, nil, errors.New("peer public key cannot be empty")
	}

	// TODO: Replace with actual Kyber encapsulation from QSmart
	// ct, ss, err := kyber.Encapsulate768(peerPublicKey)

	// Placeholder: generate mock ciphertext and shared secret
	ciphertext = make([]byte, 1088)  // Kyber768 ciphertext is ~1088 bytes
	sharedSecret = make([]byte, 32)  // Shared secret is typically 32 bytes

	_, err = rand.Read(ciphertext)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate ciphertext: %w", err)
	}

	_, err = rand.Read(sharedSecret)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate shared secret: %w", err)
	}

	log.Printf("[Kyber] Encapsulated with %s, ciphertext: %d bytes, secret: %d bytes\n",
		k.algorithm, len(ciphertext), len(sharedSecret))

	return ciphertext, sharedSecret, nil
}

// Decapsulate recovers the shared secret from ciphertext using private key
// In production, this uses actual Kyber decapsulation
func (k *KyberKEM) Decapsulate(ciphertext []byte) (sharedSecret []byte, err error) {
	if len(ciphertext) == 0 {
		return nil, errors.New("ciphertext cannot be empty")
	}

	// TODO: Replace with actual Kyber decapsulation from QSmart
	// ss, err := kyber.Decapsulate768(k.privateKey, ciphertext)

	// Placeholder: generate mock shared secret matching ciphertext
	sharedSecret = make([]byte, 32)
	_, err = rand.Read(sharedSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to generate shared secret: %w", err)
	}

	log.Printf("[Kyber] Decapsulated ciphertext (%d bytes), shared secret: %d bytes\n",
		len(ciphertext), len(sharedSecret))

	return sharedSecret, nil
}

// PQSecureConn wraps a network connection with PQ encryption using Kyber + AES
type PQSecureConn struct {
	conn         net.Conn
	sharedSecret []byte
	cipher       cipher.Block
	encryptCtr   cipher.Stream
	decryptCtr   cipher.Stream
	readBuffer   []byte
	nonce        uint64
}

// NewPQSecureConn creates a new PQ-secure connection wrapper
func NewPQSecureConn(conn net.Conn, sharedSecret []byte) (*PQSecureConn, error) {
	if len(sharedSecret) < 32 {
		return nil, errors.New("shared secret must be at least 32 bytes")
	}

	// Use first 32 bytes of shared secret as AES key
	aesKey := sharedSecret[:32]

	// Create AES cipher
	block, err := aes.NewCipher(aesKey)
	if err != nil {
		return nil, fmt.Errorf("failed to create AES cipher: %w", err)
	}

	// Create IV from next 16 bytes of shared secret (or generate if not enough bytes)
	var iv [16]byte
	if len(sharedSecret) >= 48 {
		copy(iv[:], sharedSecret[32:48])
	} else {
		copy(iv[:], make([]byte, 16))
	}

	stream := cipher.NewCTR(block, iv[:])

	return &PQSecureConn{
		conn:         conn,
		sharedSecret: sharedSecret,
		cipher:       block,
		encryptCtr:   stream,
		decryptCtr:   stream,
		readBuffer:   make([]byte, 65536), // 64KB buffer
		nonce:        0,
	}, nil
}

// Write encrypts and sends data over the connection
func (psc *PQSecureConn) Write(data []byte) (int, error) {
	if len(data) == 0 {
		return 0, nil
	}

	// Create frame: [4-byte length][encrypted data]
	frame := make([]byte, 4+len(data))
	binary.BigEndian.PutUint32(frame[:4], uint32(len(data)))

	// Encrypt payload
	ciphertext := make([]byte, len(data))
	psc.encryptCtr.XORKeyStream(ciphertext, data)
	copy(frame[4:], ciphertext)

	// Send to network
	n, err := psc.conn.Write(frame)
	log.Printf("[PQSecureConn] Write: %d bytes (frame: %d)\n", len(data), n)

	// Account for frame header
	if n > 4 {
		return n - 4, err
	}
	return 0, err
}

// Read receives and decrypts data from the connection
func (psc *PQSecureConn) Read(p []byte) (int, error) {
	// Read frame header (4 bytes length)
	header := make([]byte, 4)
	_, err := io.ReadFull(psc.conn, header)
	if err != nil {
		return 0, fmt.Errorf("failed to read frame header: %w", err)
	}

	frameLen := binary.BigEndian.Uint32(header)
	if frameLen > 65536 {
		return 0, errors.New("frame too large")
	}

	// Read encrypted payload
	encryptedData := make([]byte, frameLen)
	_, err = io.ReadFull(psc.conn, encryptedData)
	if err != nil {
		return 0, fmt.Errorf("failed to read frame data: %w", err)
	}

	// Decrypt
	plaintext := make([]byte, frameLen)
	psc.decryptCtr.XORKeyStream(plaintext, encryptedData)

	// Copy to output buffer
	n := copy(p, plaintext)
	log.Printf("[PQSecureConn] Read: %d bytes (decrypted)\n", n)

	return n, nil
}

// Close closes the underlying connection
func (psc *PQSecureConn) Close() error {
	return psc.conn.Close()
}

// LocalAddr returns the local address
func (psc *PQSecureConn) LocalAddr() net.Addr {
	return psc.conn.LocalAddr()
}

// RemoteAddr returns the remote address
func (psc *PQSecureConn) RemoteAddr() net.Addr {
	return psc.conn.RemoteAddr()
}

// SetDeadline sets read/write deadline
func (psc *PQSecureConn) SetDeadline(t time.Time) error {
	return psc.conn.SetDeadline(t)
}

// SetReadDeadline sets read deadline
func (psc *PQSecureConn) SetReadDeadline(t time.Time) error {
	return psc.conn.SetReadDeadline(t)
}

// SetWriteDeadline sets write deadline
func (psc *PQSecureConn) SetWriteDeadline(t time.Time) error {
	return psc.conn.SetWriteDeadline(t)
}

// PQHandshake performs a PQ-secure handshake using Kyber KEM
// Called by peer initiating connection
func PQHandshake(conn net.Conn, myKEM *KyberKEM) (*PQSecureConn, error) {
	// Step 1: Send our public key
	myPubKey := myKEM.publicKey
	if len(myPubKey) > 65535 {
		return nil, errors.New("public key too large")
	}

	pubKeyFrame := make([]byte, 2+len(myPubKey))
	binary.BigEndian.PutUint16(pubKeyFrame[:2], uint16(len(myPubKey)))
	copy(pubKeyFrame[2:], myPubKey)

	_, err := conn.Write(pubKeyFrame)
	if err != nil {
		return nil, fmt.Errorf("failed to send public key: %w", err)
	}

	log.Printf("[PQHandshake] Sent public key (%d bytes)\n", len(myPubKey))

	// Step 2: Receive peer's public key
	peerPubKeyHeader := make([]byte, 2)
	_, err = io.ReadFull(conn, peerPubKeyHeader)
	if err != nil {
		return nil, fmt.Errorf("failed to read peer public key header: %w", err)
	}

	peerPubKeyLen := binary.BigEndian.Uint16(peerPubKeyHeader)
	peerPubKey := make([]byte, peerPubKeyLen)
	_, err = io.ReadFull(conn, peerPubKey)
	if err != nil {
		return nil, fmt.Errorf("failed to read peer public key: %w", err)
	}

	log.Printf("[PQHandshake] Received peer public key (%d bytes)\n", peerPubKeyLen)

	// Step 3: Encapsulate (create shared secret for peer)
	ciphertext, sharedSecret, err := myKEM.Encapsulate(peerPubKey)
	if err != nil {
		return nil, fmt.Errorf("encapsulation failed: %w", err)
	}

	// Step 4: Send ciphertext to peer
	ctFrame := make([]byte, 2+len(ciphertext))
	binary.BigEndian.PutUint16(ctFrame[:2], uint16(len(ciphertext)))
	copy(ctFrame[2:], ciphertext)

	_, err = conn.Write(ctFrame)
	if err != nil {
		return nil, fmt.Errorf("failed to send ciphertext: %w", err)
	}

	log.Printf("[PQHandshake] Sent ciphertext (%d bytes)\n", len(ciphertext))

	// Step 5: Receive peer's ciphertext
	peerCtHeader := make([]byte, 2)
	_, err = io.ReadFull(conn, peerCtHeader)
	if err != nil {
		return nil, fmt.Errorf("failed to read peer ciphertext header: %w", err)
	}

	peerCtLen := binary.BigEndian.Uint16(peerCtHeader)
	peerCiphertext := make([]byte, peerCtLen)
	_, err = io.ReadFull(conn, peerCiphertext)
	if err != nil {
		return nil, fmt.Errorf("failed to read peer ciphertext: %w", err)
	}

	log.Printf("[PQHandshake] Received peer ciphertext (%d bytes)\n", peerCtLen)

	// Step 6: Decapsulate peer's ciphertext to get shared secret
	peerSharedSecret, err := myKEM.Decapsulate(peerCiphertext)
	if err != nil {
		return nil, fmt.Errorf("decapsulation failed: %w", err)
	}

	// Step 7: Combine both shared secrets for final session key
	// sharedSecret from our encapsulation + peerSharedSecret from our decapsulation
	finalSecret := append(sharedSecret, peerSharedSecret...)

	log.Printf("[PQHandshake] Handshake complete. Final session key: %d bytes\n", len(finalSecret))

	// Create PQ-secure connection
	return NewPQSecureConn(conn, finalSecret)
}

// PQHandshakeListener handles incoming PQ handshake connections
func PQHandshakeListener(conn net.Conn, myKEM *KyberKEM) (*PQSecureConn, error) {
	// Step 1: Receive peer's public key
	peerPubKeyHeader := make([]byte, 2)
	_, err := io.ReadFull(conn, peerPubKeyHeader)
	if err != nil {
		return nil, fmt.Errorf("failed to read peer public key header: %w", err)
	}

	peerPubKeyLen := binary.BigEndian.Uint16(peerPubKeyHeader)
	peerPubKey := make([]byte, peerPubKeyLen)
	_, err = io.ReadFull(conn, peerPubKey)
	if err != nil {
		return nil, fmt.Errorf("failed to read peer public key: %w", err)
	}

	// Step 2: Send our public key
	myPubKey := myKEM.publicKey
	pubKeyFrame := make([]byte, 2+len(myPubKey))
	binary.BigEndian.PutUint16(pubKeyFrame[:2], uint16(len(myPubKey)))
	copy(pubKeyFrame[2:], myPubKey)

	_, err = conn.Write(pubKeyFrame)
	if err != nil {
		return nil, fmt.Errorf("failed to send public key: %w", err)
	}

	// Step 3: Receive peer's ciphertext
	peerCtHeader := make([]byte, 2)
	_, err = io.ReadFull(conn, peerCtHeader)
	if err != nil {
		return nil, fmt.Errorf("failed to read peer ciphertext header: %w", err)
	}

	peerCtLen := binary.BigEndian.Uint16(peerCtHeader)
	peerCiphertext := make([]byte, peerCtLen)
	_, err = io.ReadFull(conn, peerCiphertext)
	if err != nil {
		return nil, fmt.Errorf("failed to read peer ciphertext: %w", err)
	}

	// Step 4: Decapsulate to get shared secret
	sharedSecret, err := myKEM.Decapsulate(peerCiphertext)
	if err != nil {
		return nil, fmt.Errorf("decapsulation failed: %w", err)
	}

	// Step 5: Encapsulate for peer
	ciphertext, peerSharedSecret, err := myKEM.Encapsulate(peerPubKey)
	if err != nil {
		return nil, fmt.Errorf("encapsulation failed: %w", err)
	}

	// Step 6: Send ciphertext to peer
	ctFrame := make([]byte, 2+len(ciphertext))
	binary.BigEndian.PutUint16(ctFrame[:2], uint16(len(ciphertext)))
	copy(ctFrame[2:], ciphertext)

	_, err = conn.Write(ctFrame)
	if err != nil {
		return nil, fmt.Errorf("failed to send ciphertext: %w", err)
	}

	// Step 7: Combine shared secrets
	finalSecret := append(sharedSecret, peerSharedSecret...)

	log.Printf("[PQHandshakeListener] Handshake complete. Final session key: %d bytes\n", len(finalSecret))

	// Create PQ-secure connection
	return NewPQSecureConn(conn, finalSecret)
}
