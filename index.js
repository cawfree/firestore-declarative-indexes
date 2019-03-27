function parallelizeInput(
  input = [[]],
  n,
) {
  return [...Array(n)]
    .reduce(
      (arr) => {
        return ([
          ...[...arr],
          ...input.map(i => ([...i])),
        ]);
      },
      [],
    );
};

function extrapolateRecursive(
  fields,
  input = [[]],
) {
  const field = fields[0];
  if (field) {
    return extrapolateRecursive(
      fields
        .filter(
          (e, i) => (i > 0),
        ),
      field.extend(
        input,
      ),
    );
  }
  return input;
}

function getDuplicateIndices(indices) {
  const stringified = indices
    .map(e => JSON.stringify(e));
  return stringified
    .filter((e, i) => stringified.indexOf(e) !== i);
}

class Field {
  appends() {
    throw new Error(
      'Method stub!',
    );
  }
  extend(input) {
    const funcs = this.appends();
    const newInput = parallelizeInput(
      input,
      funcs.length,
    );
    newInput.forEach((setOfFields, i) => {
      const permutation = Math.floor(i / input.length);
      funcs[permutation](setOfFields);
    });
    return newInput;
  }
}

class Compound extends Field {
  constructor(fields) {
    super();
    this.fields = fields;
  }
  __getFields() {
    return this.fields;
  }
  appends() {
    return this.__getFields()
      .reduce(
        (arr, field) => {
          return ([
            ...arr,
            ...field.appends(),
          ]);
        },
        [],
      );
  }
}

class Union extends Field {
  constructor(fields) {
    super();
    this.fields = fields;
  }
  __getFields() {
    return this.fields;
  }
  appends() {
    return extrapolateRecursive(
      this.__getFields(),
    )
    .map((fields) => {
      return (setOfFields) => setOfFields.push(...fields);
    });
  }
}

class Scalar extends Field {
  constructor(opts = {}) {
    super();
    this.opts = opts;
  }
  __getOpts() {
    return this.opts;
  }
  appends() {
    return ([
      (setOfFields) => {
        return setOfFields.push(
          {
            ...this.__getOpts(),
          },
        );
      },
    ]);
  }
}

class Index {
  constructor(
    fields,
    opts = {},
  ) {
    this.fields = fields;
    this.opts = opts;
  }
  build() {
    return extrapolateRecursive(
      this.__getFields(),
    )
      .map((fields) => {
        return ({
          ...this.__getOpts(),
          fields,
        });
      });
  }
  __getFields() {
    return this.fields;
  }
  __getOpts() {
    return this.opts;
  }
}

const generateIndexes = indices => {
  return indices
    .reduce(
      (arr, indices) => {
        return ([
          ...arr,
          ...indices
            .build(),
        ]);
      },
      []
    );
};

module.exports = ({
  Field,
  Compound,
  Union,
  Scalar,
  Index,
  generateIndexes,
  getDuplicateIndices,
});
