<script>
  import sodium from 'libsodium-wrappers';
  import { mnemonicToSeedSync } from 'bip39';
  import bs58check from 'bs58check';
  import sha512 from 'sha512';
  import sha256 from 'sha256';

  // >>> copied from ed25519_hd_key npm library.
  const ED25519_CURVE = 'ed25519 seed';
  const HARDENED_OFFSET = 0x80000000;

  const pathRegex = new RegExp("^m(\\/[0-9]+')+$");

  const replaceDerive = (val) => val.replace("'", '');

  function CKDPriv({ key, chainCode }, index) {
    const indexBuffer = Buffer.allocUnsafe(4);
    indexBuffer.writeUInt32BE(index, 0);

    const data = Buffer.concat([Buffer.alloc(1, 0), key, indexBuffer]);

    const I = sha512.hmac(chainCode)
        .finalize(data);
    const IL = I.slice(0, 32);
    const IR = I.slice(32);
    return {
        key: IL,
        chainCode: IR,
    };
};

  function getMasterKeyFromSeed(seed) {
    const hmac = sha512.hmac(ED25519_CURVE);
    const I = hmac.finalize(seed);
    const IL = I.slice(0, 32);
    const IR = I.slice(32);
    return {
        key: IL,
        chainCode: IR,
    };
  };

  function isValidPath(path) {
    if (!pathRegex.test(path)) {
      return false;
    }
    return !path
      .split('/')
      .slice(1)
      .map(replaceDerive)
      .some(isNaN);
  }

  function derive_path(path, seed, offset = HARDENED_OFFSET) {
    if (!isValidPath(path)) {
      throw new Error('Invalid derivation path');
    }

    const { key, chainCode } = getMasterKeyFromSeed(seed);
    const segments = path
      .split('/')
      .slice(1)
      .map(replaceDerive)
      .map(el => parseInt(el, 10));

    return segments.reduce(
        (parentKeys, segment) => CKDPriv(parentKeys, segment + offset),
        { key, chainCode },
    );
  }
  // >>> copied from ed25519_hd_key npm library.

  const prefix = {
    tz1: new Uint8Array([6, 161, 159]),
    tz2: new Uint8Array([6, 161, 161]),
    tz2: new Uint8Array([6, 161, 164]),
    KT: new Uint8Array([2, 90, 121]),

    edpk: new Uint8Array([13, 15, 37, 217]),
    edsk2: new Uint8Array([13, 15, 58, 7]),
    spsk: new Uint8Array([17, 162, 224, 201]),
    p2sk: new Uint8Array([16, 81, 238, 189]),

    sppk: new Uint8Array([3, 254, 226, 86]),
    p2pk: new Uint8Array([3, 178, 139, 127]),

    edsk: new Uint8Array([43, 246, 78, 7]),
    edsig: new Uint8Array([9, 245, 205, 134, 18]),
    spsig1: new Uint8Array([13, 115, 101, 19, 63]),
    p2sig: new Uint8Array([54, 240, 44, 52]),
    sig: new Uint8Array([4, 130, 43]),

    Net: new Uint8Array([87, 82, 0]),
    nce: new Uint8Array([69, 220, 169]),
    b: new Uint8Array([1, 52]),
    o: new Uint8Array([5, 116]),
    Lo: new Uint8Array([133, 233]),
    LLo: new Uint8Array([29, 159, 109]),
    P: new Uint8Array([2, 170]),
    Co: new Uint8Array([79, 179]),
    id: new Uint8Array([153, 103]),
  };

  function to_base_58_check(prefix, data) {
    const b = new Uint8Array(prefix.length + data.length);
    b.set(prefix);
    b.set(data, prefix.length);
    return bs58check.encode(b);
  }

  let mnemonic = "";
  let path = "m/44'/1729'/0'/0'";
  let passphrase = "";

  function calc(mnemonic, passphrase, path) {
    mnemonic = mnemonic.replace('\n', '').trim();
    if (!mnemonic.length) {
      return ["empty mnemonic"];
    }
    try {
      const root_seed = mnemonicToSeedSync(mnemonic, '');
      const seed = derive_path(path, root_seed).key;
      const keys = sodium.crypto_sign_seed_keypair(seed);
      const seed_b58 = to_base_58_check(prefix.edsk2, seed);
      const public_key_b58 = to_base_58_check(prefix.edpk, keys.publicKey);
      const public_key_hash_b58 = to_base_58_check(
        prefix.tz1,
        sodium.crypto_generichash(20, keys.publicKey),
      );
      return [null, public_key_hash_b58, seed_b58, public_key_b58];
    } catch (e) {
      return [e];
    }
  }

  let is_loaded = false;
  $: sodium.ready.then(() => is_loaded = true);
  $: [err, public_key_hash_b58, seed_b58, public_key_b58] = is_loaded ? calc(mnemonic, passphrase, path) : [];

</script>

<main>
  <h2>Derive Ledger Internal keys using Mnemonic</h2>
    <p>
      Mnemonic: <br>
      <textarea bind:value={mnemonic} rows="5" style="width: 100%; max-width: 30rem;" />
    </p>
    <p>Passphrase: <input bind:value={passphrase} type="password" /></p>
    <p>Path: <input bind:value={path} type="text" placeholder="m/44'/1729'/0'/0'" /></p>

    {#if is_loaded && !err}
      <p>Address: <b>{public_key_hash_b58}</b></p>
      <p>Secret Key: <b>{seed_b58}</b></p>
      <p>Public Key: <b>{public_key_b58}</b></p>
    {:else if !is_loaded}
      <p style="color: orange">waiting for libsodium to load...</p>
    {:else}
      <p style="color: red">{err}</p>
    {/if}
</main>

<style>
  :root {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
  main {
    padding: 0.5rem;
    padding-right: 1.2rem;
  }
</style>
