# 🔖 firestore-declarative-indexes
Get your Firestore indexes scaling easier and working harder.

## 🚀 Installing

Using `npm`:
`npm install firestore-declarative-indexes`

Using `yarn`:
`yarn add firestore-declarative-indexes`

## 💣 Purpose:
When performing compound queries in Firestore (these are where you make non-trivial queries against multiple document fields), you are often required to create _indexes_. Indexes are used to "prepare" firestore to recognize and efficiently respond to your requests, by maintaing a backlog of how contents in your documents relate to one-another.

For larger applications, the number of indexes you require commonly scale with the number of use cases. Additionally, because it is common to repeatedly query using a particular collection, developers are often required to mostly recreate existing indexes but with minor variations. Both of these circumstances conspire against the development process in terms of time and maintainability. On top of this, compound queries help minimize the number of reads we need to perform on the client, since it is possible to take the approach to perform clientside filtering and deduping on the results from multiple requests; but this approach is costly and inefficient for large datasets.

This library aims to resolve these issues by providing you with the basic mechanisms to _describe_ various permutations of your queries at a high level. This means you should only have to describe a a query just once, and have them easily scale to large permutations. In addition, because your indexes will be described algorithmically, the creation or modification of indexes will be much less prone to human error when compared to entry via the Firestore Indexes UI.


## 🔧 How does it work?
This library provides three bare-bones ways of describing a field; provided you express your Firestore Indexes using these structures, all possible permutations of hefty indexing schemes can be dynamically generated and scaled with ease.

The three building blocks of Declarative Indexes are outlined below:

### Scalar
The **Scalar Field** is used to represent a single document field that you wish to query against. These can be likened to the individual fields you accumulate when building a compound query on Firestore.

### Union
A **Union Field** represents the _concatenation_ of a number of child fields. Wherever a Union is applied, its compiled equivalent will ensure that all child fields will be returned in order in the result set. Unions are useful for declarating higher-level "blobs" in your queries; these are structures that you find yourself re-using across different collections.

### Compound (or _'concurrent'_)
The **Compound Field** guarantees that all of its child fields will **never** appear within the same Firestore Index; instead, it asserts that multiple Firestore Indexes must be created for each individual permutation of that field. Compound Fields are useful for when you need to query against multiple different aspects of a document attribute, for example the contents of an array or and object. It is possible to string together multiple Compound Fields for a single Declarative Index; just remember, since these operate using permutations, the resulting Firestore Indexes will grow exponentially!

### 💡 Example

Let's imagine we're making an app to purchase groceries, where we can filter recommendations based on a user's selected tags. After a lot of hard thought, we've come up with the collection of `items` below:

```
{items: [{
  name: 'pear',
  rating: 2.3,
  tags: [
    'horrid', 'ugly'
  ],
},
{
  name: 'carrot',
  rating: 3.4,
  tags: [
    'see-in-dark'
  ],
},
{
  name: 'apple',
  rating: 4.5,
  tags: [
    'delicious', 'red'
  ],
}]}
```

From the data, we can see that it is possible to have up to two tags assigned to an item. From a user's perspective, this means they could search through our items using either zero, one or two `tags`. To make things interesting, let's say it would also be possible to filter the returned results by `rating`, too.

To meet the conditions for satisfaction, we'd need to create the following indexes to account for all use cases:
  - `[items]`, `{rating, "ascending"}`
  - `[items]`, `{rating, "ascending"}`, `{tags, "array-contains"}`,
  - `[items]`, `{rating, "ascending"}`, `{tags, "array-contains"}`, `{tags "array-contains"}`,
  - `[items]`, `{rating, "ascending"}`, `{tags, "array-contains"}`, `{tags "array-contains"}`, `{tags "array-contains"}`,

This doesn't seem too bad, but imagine we'd need to extend functionality to support up to ten different tags. This would start to get a little tedious! Instead, let's try to express the same contents using _Declarative Indexing_:

```
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
   collectionGroup: 'itemsCollection',
   queryScope: 'COLLECTION',
 },
);
```

This implementation produces the exact same result as the manual equivalent, with the added bonus of being _dynamic_. We can choose to index on as many fields as we'd like.

## Could I nest Compounds within Unions, or vice-versa?
Absolutely! Check out some of the stress testing in `index.test.js`.

You can also find the demonstration above, just use `npm test`.

## License
[MIT](https://opensource.org/licenses/MIT)

## [@cawfree](https://twitter.com/cawfree)

Open source takes a lot of work! If this project has helped you, please consider [buying me a coffee](https://www.buymeacoffee.com/cawfree). ☕ 

<p align="center">
  <a href="https://www.buymeacoffee.com/cawfree">
    <img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy @cawfree a coffee" width="232" height="50" />
  </a>
</p>
