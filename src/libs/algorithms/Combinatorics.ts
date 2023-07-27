export abstract class Combinatorics {
    static sequenceMultiplication(max: number, minOuter = 0) {
        let result = ++minOuter;

        while (++minOuter <= max) result *= minOuter;

        return result;
    }
    
    private static readonly _factorials = [1, 1, 2];
    static factorial(n: number) {
        if (n < 0 || 100 < n) throw new Error();

        if (this._factorials.length > n) {
            return this._factorials[n];
        }

        let result = this._factorials.at(-1);
        for (let i = this._factorials.length; i <= n; ++i) {
            result *= i;
            this._factorials.push(result);
        }
        
        return result;
    }

    /** C(n,k) */
    static combinationsCount(n: number, k: number) {
        // n! / (k! * (n - k)!)
        return this.factorial(n) / (this.factorial(k) * this.factorial(n - k));
    }

    /** A(n, k) */
    static partialPermutationsCount(n: number, k: number) {
        // n! / (n - k)!
        return this.factorial(n) / this.factorial(n - k);
    }

    /** A'(n, k) */
    static repeatedPermutationsCount(n: number, k: number) {
        // n ^ k
        return n ** k;
    }

    /** P(n) */
    static permutationsCount = Combinatorics.factorial;
    
    static getRepeatedPermutation<T>(ne: T[], k: number, index: number) {
        if (index < 0 || this.repeatedPermutationsCount(ne.length, k) <= index) {
            throw new Error();
        }

        
    }

    static partialPermutation<T>(elems: T[], index: number) {

    }
}
