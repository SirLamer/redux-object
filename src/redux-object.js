/* eslint no-use-before-define: [1, 'nofunc'] */

function uniqueId(objectName, id) {
  if (!id) {
    return null;
  }

  return `${objectName}${id}`;
}

function buildRelationship(reducer, target, relationship, options, cache) {
  const {
    ignoreLinks,
    allowCircular,
    parentTree,
  } = options;
  const rel = target.relationships[relationship];

  if (typeof rel.data !== 'undefined') {
    if (Array.isArray(rel.data)) {
      return rel.data.map((child) => {
        if (!allowCircular && parentTree.indexOf(child.type) !== -1) {
          return child;
        }
        return build(reducer, child.type, child.id, options, cache) || child;
      });
    } else if (rel.data === null || (!allowCircular && parentTree.indexOf(rel.data.type) !== -1)) {
      return rel.data;
    }
    return build(reducer, rel.data.type, rel.data.id, options, cache) || rel.data;
  } else if (!ignoreLinks && rel.links) {
    throw new Error('Remote lazy loading is not supported (see: https://github.com/yury-dymov/json-api-normalizer/issues/2). To disable this error, include option \'ignoreLinks: true\' in the build function like so: build(reducer, type, id, { ignoreLinks: true })');
  }

  return undefined;
}


function relationshipMeta(ret, target, relationship) {
  if (target.relationships[relationship].meta) {
    if (!ret.meta) {
      ret.meta = {};
    }

    if (!ret.meta.relationships) {
      ret.meta.relationships = {};
    }

    ret.meta.relationships[relationship] = target.relationships[relationship].meta;
  }
}


export default function build(reducer, objectName, id = null, providedOpts = {}, cache = {}) {
  const defOpts = {
    eager: false,
    ignoreLinks: false,
    parentTree: [],
    allowCircular: true,
    includeType: false,
    includeMeta: false
  };
  const options = Object.assign({}, defOpts, providedOpts);
  const { eager, allowCircular, includeType, includeMeta } = options;

  if (!reducer[objectName]) {
    return null;
  }

  if (id === null || Array.isArray(id)) {
    const idList = id || Object.keys(reducer[objectName]);

    return idList.map(e => build(reducer, objectName, e, options, cache));
  }

  const ids = id.toString();
  const uuid = uniqueId(objectName, ids);
  const cachedObject = cache[uuid];

  if (cachedObject) {
    return cachedObject;
  }

  const ret = {};
  const target = reducer[objectName][ids];

  if (!target) {
    return null;
  }

  if (target.id) {
    ret.id = target.id;
  }

  Object.keys(target.attributes).forEach((key) => { ret[key] = target.attributes[key]; });

  if (includeMeta && target.meta) {
    ret.meta = target.meta;
  }

  if (includeType && !ret.type) {
    ret.type = objectName;
  }

  cache[uuid] = ret;

  if (target.relationships) {
    Object.keys(target.relationships).forEach((relationship) => {
      if (eager) {
        let relOptions = null;
        if (allowCircular) {
          relOptions = options;
        } else {
          relOptions = Object.assign({}, options);
          relOptions.parentTree = [].concat(options.parentTree);
          relOptions.parentTree.push(objectName);
        }
        ret[relationship] = buildRelationship(reducer, target, relationship, relOptions, cache);
        if (includeMeta) {
          relationshipMeta(ret, target, relationship);
        }
      } else {
        Object.defineProperty(
          ret,
          relationship,
          {
            enumerable: true,
            get: () => {
              const field = `__${relationship}`;

              if (ret[field]) {
                return ret[field];
              }

              ret[field] = buildRelationship(reducer, target, relationship, options, cache);
              if (includeMeta) {
                relationshipMeta(ret, target, relationship);
              }

              return ret[field];
            },
          },
        );
      }
    });
  }

  if (typeof ret.id === 'undefined') {
    ret.id = ids;
  }

  return ret;
}
