import btree from 'merkle-btree';
import util from './util';
import Message from './message';
import Identity from './identity';
import fetch from 'node-fetch';

const DEFAULT_INDEX = `/ipns/Qmbb1DRwd75rZk5TotTXJYzDSJL6BaNT1DAQ6VbKcKLhbs`;
const DEFAULT_IPFS_PROXIES = [
  `https://identi.fi`,
  `https://ipfs.io`,
  `https://ipfs.infura.io`,
  `https://www.eternum.io`
];
const IPFS_INDEX_WIDTH = 200;

class Index {
  static async load(indexRoot, ipfs) {
    const i = new Index();
    await i.init(indexRoot, ipfs);
    return i;
  }

  async init(indexRoot = DEFAULT_INDEX, ipfs = DEFAULT_IPFS_PROXIES) {
    if (typeof ipfs === `string`) {
      this.storage = new btree.IPFSGatewayStorage(ipfs);
    } else if (Array.isArray(ipfs)) {
      let url;
      for (let i = 0;i < ipfs.length;i ++) {
        const res = await fetch(`${ipfs[i]}${DEFAULT_INDEX}`).catch(() => { return {}; });
        if (res.ok && res.status === 200) {
          url = ipfs[i];
          break;
        }
      }
      if (url) {
        this.storage = new btree.IPFSGatewayStorage(url);
      } else {
        throw `Could not load index via given ipfs gateways`;
      }
    } else if (typeof ipfs === `object`) {
      this.storage = new btree.IPFSStorage(ipfs);
      this.ipfs = ipfs;
    } else {
      throw `ipfs param must be a gateway url, array of urls or a js-ipfs object`;
    }
    this.identitiesBySearchKey = await btree.MerkleBTree.getByHash(`${indexRoot}/identities_by_searchkey`, this.storage, IPFS_INDEX_WIDTH);
    this.messagesByTimestamp = await btree.MerkleBTree.getByHash(`${indexRoot}/messages_by_timestamp`, this.storage, IPFS_INDEX_WIDTH);
    return true;
  }

  /*
  Get an identity referenced by an identifier.
  If type is undefined, tries to guess it.
  */
  async get(value, type) {
    if (typeof value === `undefined`) {
      throw `Value is undefined`;
    }
    if (typeof type === `undefined`) {
      type = util.guessTypeOf(value);
    }

    const profileUri = await this.identitiesBySearchKey.get(`${encodeURIComponent(value)}:${encodeURIComponent(type)}`);
    if (profileUri) {
      const p = await this.storage.get(profileUri);
      return new Identity(JSON.parse(p));
    }
  }

  /* Save msg to index and broadcast to pubsub */
  async put(msg: Message) {
    const r = {};
    if (this.ipfs) {
      const buffer = new this.ipfs.types.Buffer(msg.jws);
      r.hash = await this.ipfs.files.add(buffer);
      r.indexUri = await this.messagesByTimestamp.put(`key`, msg.jws);
      await this.ipfs.pubsub.publish(`identifi`, buffer);
      // TODO: update ipns entry to point to new index root
    } else {
      r.hash = await fetch(`https://identi.fi/api/messages`, {
        method: `POST`,
        headers: {'Content-Type': `application/json`},
        body: msg.jws,
      });
    }
    return r;
  }

  async search(value, type, limit = 5) { // TODO: param 'exact'
    return this.identitiesBySearchKey.searchText(encodeURIComponent(value), limit);
  }
}

export default Index;
