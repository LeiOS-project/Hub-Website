
export abstract class BasicAbstractStore<T> {
    
    protected readonly options: BasicAbstractStore.Options;

    protected constructor(
        protected readonly storeKey: string,
        options?: BasicAbstractStore.InitOptions
    ) {

        // default options
        this.options = {
            enableAutoFetchIfEmpty: false,
            ...options
        };

    }

    protected abstract fetchData(): Promise<T | null>;

    protected useRaw(): Ref<T | null> {
        return useState<T | null>(this.storeKey, () => null);
    }
    

    async use(): Promise<Readonly<Ref<T | null>>> {
        if (this.options.enableAutoFetchIfEmpty) {
            await this.refreshIfNeeded();
        }
        return this.useRaw();
    }


    async refresh() {
        const data = await this.fetchData();
        this.useRaw().value = data;
    }

    async refreshIfNeeded() {
        const data = this.useRaw();
        if (!this.isValid(data)) {
            await this.refresh();
        }
    }

    async clear() {
        this.useRaw().value = null;
    }

    public isValid(data: Readonly<Ref<T | null>>): data is Ref<T> {
        return data.value !== null;
    }

}


export abstract class BasicAbstractStoreWithMetadata<T, MetaT> extends BasicAbstractStore<T> {

    //@ts-ignore
    protected override readonly options: BasicAbstractStore.OptionsWithMetadata<MetaT>;

    protected constructor(
        storeKey: string,
        options: BasicAbstractStore.InitOptionsWithMetadata<MetaT>
    ) {
        super(storeKey, options);
    }

    protected useMetadataRaw(): Ref<MetaT> {
        return useState<MetaT>(`${this.storeKey}_metadata`, () => this.options.defaultMetadata);
    }

    async useMetadata(): Promise<Readonly<Ref<MetaT>>> {
        return this.useMetadataRaw();
    }

    override async clear() {
        await super.clear();
        this.useMetadataRaw().value = this.options.defaultMetadata;
    }

}


export abstract class ModifiableAbstractStore<T, UpdateT = T> extends BasicAbstractStore<T> {

    abstract update(updates: UpdateT): Promise<void>;

}

export abstract class ModifiableAbstractStoreWithMetadata<T, MetaT, UpdateT = T> extends BasicAbstractStoreWithMetadata<T, MetaT> {
    
    abstract update(updates: UpdateT): Promise<void>;

    abstract updateMetadata(updates: Partial<MetaT>): Promise<void>;

}


export namespace BasicAbstractStore {

    export interface Options {
        enableAutoFetchIfEmpty: boolean;
    }

    export type InitOptions = Partial<Options>;

    export interface OptionsWithMetadata<MetaT> extends Options {
        defaultMetadata: MetaT;
    }

    export type InitOptionsWithMetadata<MetaT> = InitOptions & OptionsWithMetadata<MetaT>;

}