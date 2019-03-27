const {
  Field,
  Compound,
  Union,
  Scalar,
  Index,
  generateIndexes,
  getDuplicateIndices,
} = require('./index');

test('that a singular scalar index can be created', () => {
  const indexes = generateIndexes([
    new Index(
      [
        // XXX: Represents a single field to index again.
        //      You can pass arbitrary props, however for
        //      a Firestore collection you'll want to use
        //      keys like order, fieldPath, arrayConfig etc.
        new Scalar(
          {
            fieldPath: 'scalar',
            order: 'ASCENDING',
          },
        ),
      ],
      {
        collectionGroup: 'scalarCollection',
        queryScope: 'COLLECTION',
      },
    )
  ]);
  expect(indexes[0]).toBeTruthy();
  expect(indexes[0].queryScope).toBe('COLLECTION');
  expect(indexes[0].collectionGroup).toBe('scalarCollection');
  expect(indexes[0].fields).toBeTruthy();
  expect(indexes[0].fields.length).toBe(1);
});

test('that a singular compound index can be created', () => {
  const indexes = generateIndexes([
    new Index(
      [
        // XXX: A compound index is a like a permutation.
        //      These ensure that each one of their child
        //      fields are used in isolation for each 
        //      query. In this instance, the Compound index
        //      below assures we compile to two individual
        //      queries, one which indexes against scalar0 and
        //      another which indexes against scalar1.
        //
        //      These are useful for queries which interrogate
        //      the children of arrays or objects in a document.
        new Compound(
          [
            new Scalar(
              {
                fieldPath: 'scalar0',
                order: 'ASCENDING',
              },
            ),
            new Scalar(
              {
                fieldPath: 'scalar1',
                order: 'DESCENDING',
              },
            ),
          ],
        ),
      ],
      {
        collectionGroup: 'compoundCollection',
        queryScope: 'COLLECTION',
      },
    )
  ]);
  expect(indexes.length).toBe(2);
  expect(indexes[0]).toBeTruthy();
  expect(indexes[1]).toBeTruthy();
  expect(indexes[0].fields.length).toBe(1);
  expect(indexes[1].fields.length).toBe(1);
  expect(indexes[0].fields[0].fieldPath).toBe('scalar0');
  expect(indexes[0].fields[0].order).toBe('ASCENDING');
  expect(indexes[1].fields[0].fieldPath).toBe('scalar1');
  expect(indexes[1].fields[0].order).toBe('DESCENDING');
});

test('that a singular union index can be created', () => {
  const indexes = generateIndexes([
    new Index(
      [
        // XXX: A Union index is like the combination
        //      of multiple fields within a single query.
        //      Union below, we expect each query to contain
        //      an instance of both scalar0 and scalar1.
        //
        //      This is unlike the Compound index because
        //      a Compound would expect scalar0 and scalar1
        //      to be separated across different indexes 
        //      altogether.
        //
        //      It should be noted that Union indexes
        //      preserve nested Compound indexes! This
        //      means you can be sure that each permutation
        //      of your compound index can be prepended or
        //      appended with the contents of your union
        //      (or compound!).
        new Union(
          [
            new Scalar(
              {
                fieldPath: 'scalar0',
                order: 'ASCENDING',
              },
            ),
            new Scalar(
              {
                fieldPath: 'scalar1',
                order: 'DESCENDING',
              },
            ),
          ],
        ),
      ],
      {
        collectionGroup: 'unionCollection',
        queryScope: 'COLLECTION',
      },
    )
  ]);
  expect(indexes[0]).toBeTruthy();
  expect(indexes[0].fields.length).toBe(2);
  expect(indexes[0].fields[0].fieldPath).toBe('scalar0');
  expect(indexes[0].fields[1].fieldPath).toBe('scalar1');
  expect(indexes[0].fields[0].order).toBe('ASCENDING');
  expect(indexes[0].fields[1].order).toBe('DESCENDING');
});

// todo that multiple indexes can eb created in generateindex

test('that a complex compound query can be generated', () => {
  const indexes = generateIndexes([
    new Index(
      [
        // XXX: Since a Compound Field is like
        //      a permutation of that Field's
        //      nested children, a sequence of
        //      Compound Fields necessitates 
        //      multiple indexes which represent
        //      all permutations of those indexes.
        new Compound(
          [
            new Scalar(
              {
                fieldPath: 'scalar0',
                order: 'ASCENDING',
              },
            ),
            new Scalar(
              {
                fieldPath: 'scalar1',
                order: 'DESCENDING',
              },
            ),
          ],
        ),
        new Compound(
          [
            new Scalar(
              {
                fieldPath: 'scalar2',
                order: 'ASCENDING',
              },
            ),
            new Scalar(
              {
                fieldPath: 'scalar3',
                order: 'DESCENDING',
              },
            ),
          ],
        ),
        // XXX: Note that for all permutations
        //      of the precious Compound indices,
        //      scalar fields are appended to
        //      each permutation as expected.
        new Scalar(
          {
            fieldPath: 'scalar5',
            order: 'ASCENDING',
          },
        ),
      ],
      {
        collectionGroup: 'scalarCollection',
        queryScope: 'COLLECTION',
      },
    )
  ]);
  expect(JSON.stringify(indexes)).toBe(JSON.stringify([{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar0","order":"ASCENDING"},{"fieldPath":"scalar2","order":"ASCENDING"},{"fieldPath":"scalar5","order":"ASCENDING"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar1","order":"DESCENDING"},{"fieldPath":"scalar2","order":"ASCENDING"},{"fieldPath":"scalar5","order":"ASCENDING"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar0","order":"ASCENDING"},{"fieldPath":"scalar3","order":"DESCENDING"},{"fieldPath":"scalar5","order":"ASCENDING"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar1","order":"DESCENDING"},{"fieldPath":"scalar3","order":"DESCENDING"},{"fieldPath":"scalar5","order":"ASCENDING"}]}]));
  expect(true).toBeTruthy();
});

test('that a union containing compound indices can be created', () => {
  const indexes = generateIndexes([
    new Index(
      [
        new Union(
          [
            new Compound(
              [
                new Scalar(
                  {
                    fieldPath: 'scalar0',
                    order: 'ASCENDING',
                  },
                ),
                new Scalar(
                  {
                    fieldPath: 'scalar1',
                    order: 'ASCENDING',
                  },
                ),
                new Scalar(
                  {
                    fieldPath: 'scalar2',
                    order: 'DESCENDING',
                  },
                ),
              ]
            ),
            new Scalar(
              {
                fieldPath: 'scalar3',
                order: 'ASCENDING',
              },
            ),
            new Scalar(
              {
                fieldPath: 'scalar4',
                order: 'DESCENDING',
              },
            ),
          ],
        ),
      ],
      {
        collectionGroup: 'scalarCollection',
        queryScope: 'COLLECTION',
      },
    )
  ]);
  expect(JSON.stringify([{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar0","order":"ASCENDING"},{"fieldPath":"scalar3","order":"ASCENDING"},{"fieldPath":"scalar4","order":"DESCENDING"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar1","order":"ASCENDING"},{"fieldPath":"scalar3","order":"ASCENDING"},{"fieldPath":"scalar4","order":"DESCENDING"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar2","order":"DESCENDING"},{"fieldPath":"scalar3","order":"ASCENDING"},{"fieldPath":"scalar4","order":"DESCENDING"}]}])).toEqual(JSON.stringify(indexes));
});

test('that a union of compound compound indexes can be created', () => {
  const indexes = generateIndexes([
    new Index(
      [
        new Union(
          [
            new Compound(
              [
                new Compound(
                  [
                    new Scalar(
                      {
                        fieldPath: 'scalar0',
                      },
                    ),
                    new Scalar(
                      {
                        
                        fieldPath: 'scalar1',
                      },
                    ),
                  ],
                ),
                new Compound(
                  [
                    new Scalar(
                      {
                        fieldPath: 'scalar2',
                      },
                    ),
                    new Scalar(
                      {
                        
                        fieldPath: 'scalar3',
                      },
                    ),
                  ],
                ),
              ],
            ),
            new Compound(
              [
                new Compound(
                  [
                    new Scalar(
                      {
                        fieldPath: 'scalar4',
                      },
                    ),
                    new Scalar(
                      {
                        
                        fieldPath: 'scalar5',
                      },
                    ),
                  ],
                ),
                new Compound(
                  [
                    new Scalar(
                      {
                        fieldPath: 'scalar6',
                      },
                    ),
                    new Scalar(
                      {
                        
                        fieldPath: 'scalar7',
                      },
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ],
      {
        collectionGroup: 'scalarCollection',
        queryScope: 'COLLECTION',
      },
    )
  ]);
  expect(JSON.stringify([{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar0"},{"fieldPath":"scalar4"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar1"},{"fieldPath":"scalar4"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar2"},{"fieldPath":"scalar4"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar3"},{"fieldPath":"scalar4"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar0"},{"fieldPath":"scalar5"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar1"},{"fieldPath":"scalar5"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar2"},{"fieldPath":"scalar5"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar3"},{"fieldPath":"scalar5"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar0"},{"fieldPath":"scalar6"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar1"},{"fieldPath":"scalar6"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar2"},{"fieldPath":"scalar6"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar3"},{"fieldPath":"scalar6"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar0"},{"fieldPath":"scalar7"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar1"},{"fieldPath":"scalar7"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar2"},{"fieldPath":"scalar7"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar3"},{"fieldPath":"scalar7"}]}])).toBe(JSON.stringify(indexes));
});

test('that a compound index can nest unions', () => {
  const indexes = generateIndexes([
    new Index(
      [
        // XXX: Represents a single field to index again.
        //      You can pass arbitrary props, however for
        //      a Firestore collection you'll want to use
        //      keys like order, fieldPath, arrayConfig etc.
        new Compound(
          [
            new Union(
              [
                new Scalar(
                  {
                    fieldPath: 'scalar0',
                  },
                ),
                new Scalar(
                  {
                    fieldPath: 'scalar1',
                  },
                ),
              ],
            ),
            new Union(
              [
                new Scalar(
                  {
                    fieldPath: 'scalar2',
                  },
                ),
                new Scalar(
                  {
                    fieldPath: 'scalar3',
                  },
                ),
              ],
            ),
            new Union(
              [
                new Scalar(
                  {
                    fieldPath: 'scalar4',
                  },
                ),
                new Scalar(
                  {
                    fieldPath: 'scalar5',
                  },
                ),
              ],
            ),
          ],
        ),
      ],
      {
        collectionGroup: 'scalarCollection',
        queryScope: 'COLLECTION',
      },
    )
  ]);
  expect(JSON.stringify([{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar0"},{"fieldPath":"scalar1"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar2"},{"fieldPath":"scalar3"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"scalar4"},{"fieldPath":"scalar5"}]}])).toBe(JSON.stringify(indexes));
});

test('that the rating example works', () => {
  const numberOfRatings = 3;
  const indexes = generateIndexes([
    new Index(
      [
        new Scalar(
          {
            fieldPath: 'rating',
          },
        ),
        new Compound(
          [...Array(numberOfRatings + 1)]
            .map((e, i) => i)
            .map((i) => {
              return new Union(
                [...Array(i)]
                  .map(() => 
                    new Scalar(
                      {
                        fieldPath: 'tags',
                        arrayConfig: 'CONTAINS',
                      },
                    ),
                  ),
              );
            }),
        ),
      ],
      {
        collectionGroup: 'scalarCollection',
        queryScope: 'COLLECTION',
      },
    )
  ]);
  // XXX: Note this will only work for numberOfRatings = 3!
  expect(JSON.stringify([{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"rating"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"rating"},{"fieldPath":"tags","arrayConfig":"CONTAINS"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"rating"},{"fieldPath":"tags","arrayConfig":"CONTAINS"},{"fieldPath":"tags","arrayConfig":"CONTAINS"}]},{"collectionGroup":"scalarCollection","queryScope":"COLLECTION","fields":[{"fieldPath":"rating"},{"fieldPath":"tags","arrayConfig":"CONTAINS"},{"fieldPath":"tags","arrayConfig":"CONTAINS"},{"fieldPath":"tags","arrayConfig":"CONTAINS"}]}])).toBe(JSON.stringify(indexes));
});

